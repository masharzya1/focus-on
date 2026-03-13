#!/bin/bash
# ============================================================
#  Focus On — Android Build Setup for GitHub Codespaces
#  Fix: Kotlin/Java version mismatch (React Native 0.81.5)
#  Usage: bash setup-android-codespace.sh
# ============================================================

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo "🚀 Focus On — Android Build Setup (Codespace)"
echo "==============================================="
echo ""

# ── 1. JDK 17 ───────────────────────────────────────────────
log "Step 1: JDK 17 set করছি..."

# Java যেখানেই থাকুক (sdkman, apt, অন্য জায়গা) খুঁজে বের করো
JAVA_BIN=$(which java 2>/dev/null || true)

if [ -z "$JAVA_BIN" ]; then
  warn "Java নেই, install করছি..."
  sudo apt-get update -qq && sudo apt-get install -y -qq openjdk-17-jdk
  JAVA_BIN=$(which java)
fi

# JAVA_HOME auto-detect — sdkman বা apt যেকোনো installation এ কাজ করবে
export JAVA_HOME=$(dirname $(dirname $(readlink -f $JAVA_BIN)))
export PATH=$JAVA_HOME/bin:$PATH

log "JAVA_HOME: $JAVA_HOME"
log "Java: $(java -version 2>&1 | head -1)"

# ── 2. Android SDK ───────────────────────────────────────────
log "Step 2: Android SDK setup করছি..."

export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
  warn "cmdline-tools নেই, download করছি (~130MB)..."
  mkdir -p $ANDROID_HOME/cmdline-tools
  cd /tmp
  wget -q --show-progress \
    https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
    -O cmdline-tools.zip
  unzip -q cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools
  mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest
  rm cmdline-tools.zip
  log "cmdline-tools installed"
else
  log "cmdline-tools already আছে"
fi

yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager --quiet "platform-tools" "platforms;android-35" "build-tools;35.0.0"
log "Android SDK ready"

# ── Project directory খুঁজো ──────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if   [ -d "focus-on" ];                   then PROJECT_DIR="focus-on"
elif [ -d "focus-on-main/focus-on" ];     then PROJECT_DIR="focus-on-main/focus-on"
elif [ -f "package.json" ];               then PROJECT_DIR="."
else err "Project directory খুঁজে পাচ্ছি না! Script টা project-এর পাশে রাখো।"
fi

log "Project: $PROJECT_DIR"
cd "$PROJECT_DIR"

# ── 3. npm install ───────────────────────────────────────────
log "Step 3: npm install করছি..."
npm install --legacy-peer-deps
log "npm install done"

# ── 4. Expo Prebuild ─────────────────────────────────────────
log "Step 4: Expo prebuild করছি..."
if [ -d "android" ]; then
  warn "android/ folder আছে — clean rebuild করছি..."
  npx expo prebuild --platform android --clean
else
  npx expo prebuild --platform android
fi
log "Prebuild done"

# ── 5. THE MAIN FIX: Kotlin + Java version mismatch ─────────
log "Step 5: Kotlin/Java version mismatch fix করছি..."

BUILD_GRADLE="android/build.gradle"
APP_BUILD_GRADLE="android/app/build.gradle"

# 5a. Kotlin version → 2.0.21 (React Native 0.81.5 এর সাথে compatible)
if grep -q "kotlinVersion" "$BUILD_GRADLE"; then
  sed -i 's/kotlinVersion\s*=\s*"[^"]*"/kotlinVersion = "2.0.21"/' "$BUILD_GRADLE"
else
  sed -i '/ext {/a\        kotlinVersion = "2.0.21"' "$BUILD_GRADLE"
fi
log "kotlinVersion → 2.0.21"

# 5b. sourceCompatibility / targetCompatibility → VERSION_17
sed -i 's/sourceCompatibility\s*=\s*JavaVersion\.[A-Z_0-9]*/sourceCompatibility = JavaVersion.VERSION_17/g' "$APP_BUILD_GRADLE"
sed -i 's/targetCompatibility\s*=\s*JavaVersion\.[A-Z_0-9]*/targetCompatibility = JavaVersion.VERSION_17/g' "$APP_BUILD_GRADLE"
log "compileOptions → VERSION_17"

# 5c. jvmTarget → "17"
if grep -q "jvmTarget" "$APP_BUILD_GRADLE"; then
  sed -i 's/jvmTarget\s*=\s*"[^"]*"/jvmTarget = "17"/g' "$APP_BUILD_GRADLE"
  log "jvmTarget → 17"
else
  # kotlinOptions block নেই, compileOptions এর আগে add করো
  sed -i '/compileOptions {/i\    kotlinOptions {\n        jvmTarget = "17"\n    }\n' "$APP_BUILD_GRADLE"
  log "kotlinOptions { jvmTarget = 17 } add করা হলো"
fi

# 5d. Verify
echo ""
echo "  📋 android/build.gradle:"
grep -E "kotlinVersion|classpath.*kotlin" "$BUILD_GRADLE" | sed 's/^/     /'
echo "  📋 android/app/build.gradle:"
grep -E "sourceCompatibility|targetCompatibility|jvmTarget" "$APP_BUILD_GRADLE" | sed 's/^/     /'
echo ""

# ── 6. Gradle memory fix ────────────────────────────────────
log "Step 6: Gradle memory settings fix করছি..."

GRADLE_PROPS="android/gradle.properties"
TOTAL_RAM_MB=$(( $(grep MemTotal /proc/meminfo | awk '{print $2}') / 1024 ))
log "Codespace RAM: ${TOTAL_RAM_MB}MB"

if   [ $TOTAL_RAM_MB -lt 4000 ]; then HEAP="1536m"
elif [ $TOTAL_RAM_MB -lt 8000 ]; then HEAP="2048m"
else                                   HEAP="3072m"
fi

sed -i '/org.gradle.jvmargs/d'   "$GRADLE_PROPS"
sed -i '/org.gradle.daemon/d'    "$GRADLE_PROPS"
sed -i '/org.gradle.parallel/d'  "$GRADLE_PROPS"
sed -i '/org.gradle.caching/d'   "$GRADLE_PROPS"

cat >> "$GRADLE_PROPS" << EOF

# Codespace optimizations
org.gradle.jvmargs=-Xmx${HEAP} -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8
org.gradle.daemon=false
org.gradle.parallel=false
org.gradle.caching=true
EOF

log "Gradle heap: ${HEAP}, daemon: OFF"

# ── 7. local.properties ──────────────────────────────────────
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
log "local.properties set"

# ── 8. Save env vars to .bashrc ──────────────────────────────
sed -i '/# FocusOn Android Setup/,/# End FocusOn Setup/d' ~/.bashrc
cat >> ~/.bashrc << 'BASHEOF'
# FocusOn Android Setup
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
# End FocusOn Setup
BASHEOF
log "~/.bashrc updated"

# ── 9. BUILD ─────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "সব ঠিক! Build শুরু হচ্ছে... ☕"
echo "(১০-২০ মিনিট লাগতে পারে)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd android

./gradlew assembleDebug \
  --no-daemon \
  --no-parallel \
  --stacktrace \
  2>&1 | tee ../build.log

BUILD_STATUS=${PIPESTATUS[0]}

if [ $BUILD_STATUS -eq 0 ]; then
  APK=$(find . -name "*.apk" -path "*/debug/*" | head -1)
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "🎉 BUILD SUCCESSFUL!"
  log "APK: android/$APK"
  echo ""
  echo "👉 VS Code Explorer এ APK file এ right-click → Download করো।"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${RED}❌ Build failed! Last 40 lines of build.log:${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  tail -40 ../build.log
  echo ""
  echo "💡 build.log file টা Claude কে দেখাও — exact error দেখে fix করবো।"
fi
