import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudy } from '@/contexts/StudyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS } from '@/constants/theme';
import type { StudyPlan, PlannedTask } from '@/types/study';

function daysLeft(examDate: string) {
  return Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}


function DatePicker({ value, onChange, colors }: { value: string; onChange: (v: string) => void; colors: any }) {
  const now = new Date();
  const init = value ? new Date(value + 'T00:00:00') : now;
  const [year, setYear] = React.useState(init.getFullYear());
  const [month, setMonth] = React.useState(init.getMonth() + 1);
  const [day, setDay] = React.useState(init.getDate());

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const emit = (y: number, mo: number, d: number) => {
    const safe = Math.min(d, new Date(y, mo, 0).getDate());
    onChange(`${y}-${String(mo).padStart(2,'0')}-${String(safe).padStart(2,'0')}`);
    return safe;
  };

  const adjYear  = (n: number) => { const y = Math.max(now.getFullYear(), year + n); setYear(y); setDay(emit(y, month, day)); };
  const adjMonth = (n: number) => { let mo = month + n; if (mo > 12) { mo = 1; setYear(y => { const ny = y+1; return ny; }); } if (mo < 1) { mo = 12; setYear(y => y-1); } setMonth(mo); setDay(emit(year, mo, day)); };
  const adjDay   = (n: number) => { const max = new Date(year, month, 0).getDate(); const d = ((day - 1 + n + max) % max) + 1; setDay(d); emit(year, month, d); };

  return (
    <View style={{ backgroundColor: colors.inputBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
        {/* Day */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textFaint, letterSpacing: 1 }}>DAY</Text>
          <TouchableOpacity onPress={() => adjDay(1)} style={[dpS.adj, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="chevron-up" size={16} color={colors.accent} />
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, minWidth: 40, textAlign: 'center' }}>{day}</Text>
          <TouchableOpacity onPress={() => adjDay(-1)} style={[dpS.adj, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="chevron-down" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Month */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textFaint, letterSpacing: 1 }}>MONTH</Text>
          <TouchableOpacity onPress={() => adjMonth(1)} style={[dpS.adj, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="chevron-up" size={16} color={colors.accent} />
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, minWidth: 52, textAlign: 'center' }}>{MONTHS[month-1]}</Text>
          <TouchableOpacity onPress={() => adjMonth(-1)} style={[dpS.adj, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="chevron-down" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Year */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textFaint, letterSpacing: 1 }}>YEAR</Text>
          <TouchableOpacity onPress={() => adjYear(1)} style={[dpS.adj, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="chevron-up" size={16} color={colors.accent} />
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, minWidth: 60, textAlign: 'center' }}>{year}</Text>
          <TouchableOpacity onPress={() => adjYear(-1)} style={[dpS.adj, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="chevron-down" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14, textAlign: 'center', marginTop: 14 }}>
        {MONTHS[month-1]} {day}, {year}
      </Text>
    </View>
  );
}

const dpS = StyleSheet.create({
  adj: { width: 34, height: 28, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
});

export default function PlanScreen() {
  const { state, addStudyPlan, deleteStudyPlan, completePlanTask } = useStudy();
  const { colors: c } = useTheme();

  const [step, setStep] = useState(0);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<StudyPlan|null>(null);
  const today = new Date().toISOString().split('T')[0];

  function resetForm() {
    setStep(0); setExamName(''); setExamDate(''); setDailyHours(3); setSelectedSubjects([]);
  }

  function generatePlan() {
    if (!examDate || selectedSubjects.length === 0) return;
    const examDt = new Date(examDate);
    const now = new Date();
    const totalDays = Math.max(1, Math.ceil((examDt.getTime() - now.getTime()) / 86400000));
    const dailyMinutes = dailyHours * 60;
    const allTopics: {topicId:string;subjectId:string;difficulty:number;estimatedMinutes:number}[] = [];
    state.subjects.filter(s => selectedSubjects.includes(s.id)).forEach(subject => {
      subject.chapters.forEach(ch => {
        ch.topics.filter(t => !t.completed).forEach(t => {
          allTopics.push({ topicId: t.id, subjectId: subject.id, difficulty: t.difficulty, estimatedMinutes: t.estimatedMinutes });
        });
      });
    });
    allTopics.sort((a, b) => b.difficulty - a.difficulty);
    const studyDays = Math.ceil(totalDays * 0.8);
    const tasks: PlannedTask[] = [];
    let currentDay = 0, dayUsed = 0;
    for (const topic of allTopics) {
      if (currentDay >= studyDays) break;
      if (dayUsed + topic.estimatedMinutes > dailyMinutes && dayUsed > 0) { currentDay++; dayUsed = 0; }
      if (currentDay >= studyDays) break;
      const d = new Date(now); d.setDate(d.getDate() + currentDay);
      tasks.push({ id: Date.now().toString() + Math.random(), date: d.toISOString().split('T')[0], topicId: topic.topicId, subjectId: topic.subjectId, estimatedMinutes: topic.estimatedMinutes, completed: false, type: 'study' });
      dayUsed += topic.estimatedMinutes;
    }
    const plan: StudyPlan = { id: Date.now().toString(), examName: examName.trim() || 'Exam', examDate, subjects: selectedSubjects, dailyHours, createdAt: new Date().toISOString(), tasks };
    addStudyPlan(plan);
    resetForm(); setShowCreate(false);
  }

  const STEP_LABELS = ['Exam Details', 'Daily Schedule', 'Select Subjects'];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={ps.header}>
          <View>
            <Text style={[ps.title, { color: c.text }]}>Study Plans</Text>
            <Text style={[ps.subtitle, { color: c.textMuted }]}>Smart distributed schedules</Text>
          </View>
          <TouchableOpacity style={[ps.addBtn, { backgroundColor: c.accent, borderBottomWidth: 3, borderBottomColor: c.accentDark }]} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={ps.addBtnText}>New Plan</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ padding: 16 }}>
          {state.studyPlans.length === 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[ps.emptyCard, { backgroundColor: c.bgCard, borderColor: c.border }]}>
              <View style={[ps.emptyIcon, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="clipboard-outline" size={32} color={c.accent} />
              </View>
              <Text style={[ps.emptyText, { color: c.text }]}>No plans yet</Text>
              <Text style={[ps.emptySub, { color: c.textMuted }]}>Create a plan to auto-schedule your study topics</Text>
            </Animated.View>
          )}

          {state.studyPlans.map((plan, idx) => {
            const dl = daysLeft(plan.examDate);
            const completedTasks = plan.tasks.filter(t => t.completed).length;
            const progress = plan.tasks.length > 0 ? Math.round((completedTasks / plan.tasks.length) * 100) : 0;
            const todayTasks = plan.tasks.filter(t => t.date === today);
            const todayDone = todayTasks.filter(t => t.completed).length;
            const urgentColor = dl <= 7 ? c.destructive : dl <= 14 ? c.streakColor : c.success;

            return (
              <Animated.View key={plan.id} entering={FadeInDown.delay(idx*60).duration(400)}>
                <TouchableOpacity
                  style={[ps.planCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                  onPress={() => setViewingPlan(plan)}
                  onLongPress={() => Alert.alert('Delete Plan', `Delete "${plan.examName}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteStudyPlan(plan.id) },
                  ])}
                >
                  <View style={ps.planRow}>
                    <View style={[ps.planIcon, { backgroundColor: c.accentSoft }]}>
                      <Ionicons name="school-outline" size={22} color={c.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ps.planName, { color: c.text }]}>{plan.examName}</Text>
                      <Text style={[ps.planDate, { color: c.textMuted }]}>{fmtDate(plan.examDate)}</Text>
                    </View>
                    <View style={[ps.daysLeftBadge, { backgroundColor: urgentColor + '18' }]}>
                      <Text style={[ps.daysLeftText, { color: urgentColor }]}>
                        {dl > 0 ? `${dl}d` : 'Past'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 10 }}>
                    <View style={[ps.progressBg, { backgroundColor: c.border }]}>
                      <View style={[ps.progressFill, { width: `${progress}%`, backgroundColor: c.accent }]} />
                    </View>
                    <View style={ps.progressMeta}>
                      <Text style={[ps.progressLabel, { color: c.textMuted }]}>{completedTasks}/{plan.tasks.length} tasks</Text>
                      <Text style={[ps.progressLabel, { color: c.accent }]}>{progress}%</Text>
                    </View>
                  </View>

                  {todayTasks.length > 0 && (
                    <View style={[ps.todayBanner, { backgroundColor: c.accentSoft }]}>
                      <Ionicons name="today-outline" size={14} color={c.accent} />
                      <Text style={[ps.todayText, { color: c.accent }]}>Today: {todayDone}/{todayTasks.length} tasks</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Plan Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { resetForm(); setShowCreate(false); }}>
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[ps.modalHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => { resetForm(); setShowCreate(false); }}>
              <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[ps.modalTitle, { color: c.text }]}>{STEP_LABELS[step]}</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Step dots */}
          <View style={ps.stepDots}>
            {[0,1,2].map(i => (
              <View key={i} style={[ps.stepDot, {
                backgroundColor: i <= step ? c.accent : c.border,
                width: i === step ? 24 : 8,
              }]} />
            ))}
          </View>

          <ScrollView style={{ flex: 1, padding: 24 }}>
            {step === 0 && (
              <View>
                <Text style={[ps.fieldLabel, { color: c.textMuted }]}>EXAM NAME</Text>
                <TextInput
                  style={[ps.input, { backgroundColor: c.inputBg, color: c.text, borderColor: c.border }]}
                  placeholder="e.g. Physics Final Exam"
                  placeholderTextColor={c.textFaint}
                  value={examName}
                  onChangeText={setExamName}
                />
                <Text style={[ps.fieldLabel, { color: c.textMuted }]}>EXAM DATE</Text>
                <DatePicker value={examDate} onChange={setExamDate} colors={c} />
              </View>
            )}
            {step === 1 && (
              <View>
                <Text style={[ps.fieldLabel, { color: c.textMuted }]}>DAILY STUDY HOURS</Text>
                <View style={ps.hoursGrid}>
                  {[1,2,3,4,5,6,8].map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[ps.hourChip, {
                        backgroundColor: dailyHours === h ? c.accent : c.bgSecondary,
                        borderBottomWidth: dailyHours === h ? 3 : 0,
                        borderBottomColor: c.accentDark,
                      }]}
                      onPress={() => setDailyHours(h)}
                    >
                      <Text style={[ps.hourChipText, { color: dailyHours === h ? '#fff' : c.textMuted }]}>{h}h</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[ps.infoBox, { backgroundColor: c.accentSoft, borderColor: c.border }]}>
                  <Ionicons name="information-circle-outline" size={18} color={c.accent} />
                  <Text style={[ps.infoText, { color: c.text }]}>
                    Plan distributes topics across days, with 20% reserved for revision.
                  </Text>
                </View>
              </View>
            )}
            {step === 2 && (
              <View>
                <Text style={[ps.fieldLabel, { color: c.textMuted }]}>SELECT SUBJECTS</Text>
                {state.subjects.length === 0 ? (
                  <Text style={{ color: c.textMuted }}>No subjects yet. Add subjects first.</Text>
                ) : state.subjects.map(sub => {
                  const topics = sub.chapters.flatMap(ch => ch.topics).filter(t => !t.completed);
                  const sel = selectedSubjects.includes(sub.id);
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[ps.subjectChip, {
                        backgroundColor: sel ? sub.color + '15' : c.bgCard,
                        borderColor: sel ? sub.color : c.border,
                      }]}
                      onPress={() => setSelectedSubjects(p => sel ? p.filter(id => id !== sub.id) : [...p, sub.id])}
                    >
                      <View style={[ps.subjectDot, { backgroundColor: sub.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[ps.subjectChipName, { color: c.text }]}>{sub.name}</Text>
                        <Text style={[ps.subjectChipSub, { color: c.textMuted }]}>{topics.length} remaining topics</Text>
                      </View>
                      <View style={[ps.checkBox, { borderColor: sel ? sub.color : c.border, backgroundColor: sel ? sub.color : 'transparent' }]}>
                        {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={[ps.footer, { borderTopColor: c.border, backgroundColor: c.bg }]}>
            {step > 0 && (
              <TouchableOpacity style={[ps.backBtn, { borderColor: c.border }]} onPress={() => setStep(s => s-1)}>
                <Text style={{ color: c.textMuted, fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[ps.nextBtn, { backgroundColor: c.accent, borderBottomWidth: 4, borderBottomColor: c.accentDark, opacity: (step === 0 && !examDate) ? 0.5 : 1 }]}
              onPress={() => step < 2 ? setStep(s => s+1) : generatePlan()}
              disabled={step === 0 && !examDate}
            >
              <Text style={ps.nextBtnText}>{step < 2 ? 'Continue' : 'Generate Plan'}</Text>
              <Ionicons name={step < 2 ? 'arrow-forward' : 'checkmark'} size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* View Plan Modal */}
      {viewingPlan && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewingPlan(null)}>
          <View style={{ flex: 1, backgroundColor: c.bg }}>
            <View style={[ps.modalHeader, { borderBottomColor: c.border }]}>
              <TouchableOpacity onPress={() => setViewingPlan(null)}>
                <Text style={{ color: c.textMuted, fontWeight: '500' }}>Close</Text>
              </TouchableOpacity>
              <Text style={[ps.modalTitle, { color: c.text }]} numberOfLines={1}>{viewingPlan.examName}</Text>
              <View style={[ps.daysLeftBadge, { backgroundColor: c.accentSoft }]}>
                <Text style={[ps.daysLeftText, { color: c.accent }]}>{daysLeft(viewingPlan.examDate)}d</Text>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {Object.entries(
                viewingPlan.tasks.reduce((acc: Record<string, PlannedTask[]>, t) => {
                  acc[t.date] = [...(acc[t.date] || []), t]; return acc;
                }, {})
              ).sort(([a],[b]) => a.localeCompare(b)).slice(0, 14).map(([date, tasks]) => (
                <View key={date} style={{ marginBottom: 18 }}>
                  <View style={[ps.dateSep, { backgroundColor: c.accentSoft }]}>
                    <Ionicons name={date === today ? 'locate' : 'calendar-outline'} size={13} color={c.accent} />
                    <Text style={[ps.dateSepText, { color: c.accent }]}>
                      {date === today ? 'Today' : fmtDate(date)}
                    </Text>
                  </View>
                  {tasks.map(task => {
                    let topicName = 'Topic', subName = '';
                    for (const sub of state.subjects) for (const ch of sub.chapters) {
                      const t = ch.topics.find(t => t.id === task.topicId);
                      if (t) { topicName = t.name; subName = sub.name; break; }
                    }
                    const sub = state.subjects.find(s => s.id === task.subjectId);
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={[ps.taskRow, { backgroundColor: c.bgCard, borderColor: task.completed ? c.success + '40' : c.border }]}
                        onPress={() => !task.completed && completePlanTask(task.id)}
                      >
                        <View style={[ps.taskDot, { backgroundColor: sub?.color || c.accent }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[ps.taskName, { color: c.text }, task.completed && { color: c.textMuted, textDecorationLine: 'line-through' }]}>{topicName}</Text>
                          <Text style={[ps.taskSub, { color: c.textMuted }]}>{subName} · {task.estimatedMinutes}m</Text>
                        </View>
                        <View style={[ps.checkBox, { borderColor: task.completed ? c.success : c.border, backgroundColor: task.completed ? c.success : 'transparent' }]}>
                          {task.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const ps = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.lg },
  addBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: RADIUS.xxl, borderWidth: 1, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 17, fontWeight: '700' },
  emptySub:  { fontSize: 13, textAlign: 'center' },
  planCard: { borderRadius: RADIUS.xl, padding: 18, marginBottom: 12, borderWidth: 1 },
  planRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIcon: { width: 46, height: 46, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 16, fontWeight: '700' },
  planDate: { fontSize: 12, marginTop: 2 },
  daysLeftBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  daysLeftText: { fontSize: 13, fontWeight: '800' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, fontWeight: '500' },
  todayBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md },
  todayText: { fontSize: 12, fontWeight: '700' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  stepDots: { flexDirection: 'row', gap: 6, justifyContent: 'center', padding: 16 },
  stepDot: { height: 8, borderRadius: 4 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 18 },
  input: { borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 4 },
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  hourChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.lg },
  hourChipText: { fontSize: 15, fontWeight: '700' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  subjectChip: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 10 },
  subjectDot: { width: 12, height: 12, borderRadius: 6 },
  subjectChipName: { fontSize: 15, fontWeight: '600' },
  subjectChipSub: { fontSize: 11, marginTop: 2 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1 },
  backBtn: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center' },
  nextBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  dateSep: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md, marginBottom: 8, alignSelf: 'flex-start' },
  dateSepText: { fontSize: 13, fontWeight: '700' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 8 },
  taskDot: { width: 10, height: 10, borderRadius: 5 },
  taskName: { fontSize: 13, fontWeight: '600' },
  taskSub:  { fontSize: 11, marginTop: 2 },
});
