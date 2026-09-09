import { randomUUID } from 'node:crypto';
import { courseCatalog, createInitialProductState } from './seed-data.mjs';

const formatDate = () => new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar',
}).format(new Date());

const makeEvent = (type, message, actor) => ({
  id: randomUUID(), type, message, actor: actor.name, date: formatDate(),
});

const courseById = (id) => courseCatalog.find((course) => course.id === id);
const courseByTitle = (title) => courseCatalog.find((course) => course.title === title) || courseCatalog[0];
const scoreFrom = (signals) => Math.round(
  signals.knowledge * 0.35 + signals.behavior * 0.30
  + signals.reporting * 0.20 + signals.improvement * 0.15,
);

const relevant = (audience, actor) => {
  const normalized = String(audience).toLowerCase();
  const department = String(actor.department || '').toLowerCase();
  return normalized === 'all employees' || normalized === department || normalized === `${department} department`;
};

function requireAssignment(state, courseId, actor, campaignId) {
  return state.assignments.find((item) => item.courseId === courseId && (!campaignId || item.campaignId === campaignId) && relevant(item.audience, actor));
}

export function applyProductAction(currentState, action, payload, actor) {
  const state = structuredClone(currentState);
  let result = null;

  switch (action) {
    case 'createCampaign': {
      const id = payload.id || `${payload.campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${randomUUID().slice(0, 8)}`;
      state.campaigns.unshift({ ...payload.campaign, id });
      state.events.unshift(makeEvent('campaign.created', payload.campaign.name, actor));
      result = { id };
      break;
    }
    case 'updateCampaignStatus': {
      const campaign = state.campaigns.find((item) => item.id === payload.id);
      if (!campaign) throw Object.assign(new Error('Campaign tidak ditemukan.'), { status: 404, code: 'CAMPAIGN_NOT_FOUND' });
      const transitions = {
        Draft: ['Scheduled', 'Cancelled'], Scheduled: ['Draft', 'Active', 'Cancelled'],
        Active: ['Completed', 'Closed', 'Cancelled'], Completed: ['Closed'],
        Closed: [], Cancelled: ['Draft'],
      };
      if (payload.status !== campaign.status && !transitions[campaign.status]?.includes(payload.status)) {
        throw Object.assign(new Error(`Transisi ${campaign.status} ke ${payload.status} tidak diizinkan.`), { status: 409, code: 'INVALID_CAMPAIGN_TRANSITION' });
      }
      campaign.status = payload.status;
      state.events.unshift(makeEvent('campaign.status_updated', `${campaign.name}: ${payload.status}`, actor));
      break;
    }
    case 'launchCampaign': {
      const campaign = state.campaigns.find((item) => item.id === payload.id);
      if (!campaign) throw Object.assign(new Error('Campaign tidak ditemukan.'), { status: 404, code: 'CAMPAIGN_NOT_FOUND' });
      if (!['Draft', 'Scheduled'].includes(campaign.status)) {
        throw Object.assign(new Error('Hanya campaign Draft atau Scheduled yang dapat diluncurkan.'), { status: 409, code: 'INVALID_CAMPAIGN_STATUS' });
      }
      if (state.assignments.some((item) => item.campaignId === payload.id)) {
        throw Object.assign(new Error('Campaign ini sudah memiliki assignment.'), { status: 409, code: 'CAMPAIGN_ALREADY_LAUNCHED' });
      }
      const dueDate = campaign.learningDueDate || campaign.endDate || formatDate();
      const newAssignments = campaign.learning.map((title) => {
        const course = courseByTitle(title);
        return {
          id: randomUUID(), campaignId: campaign.id, courseId: course.id, courseTitle: course.title,
          audience: campaign.audience, employees: campaign.employees, dueDate, createdAt: formatDate(),
          required: true, progress: 0, status: 'Not Started',
        };
      });
      const newAssessments = [];
      if (campaign.baselineEnabled) {
        newAssessments.push({
          id: randomUUID(), campaignId: campaign.id, type: 'Baseline',
          title: `Assessment Awal ${campaign.name}`, status: 'Available',
          dueDate: campaign.startDate || dueDate,
        });
      }
      if (campaign.followUpEnabled) {
        newAssessments.push({
          id: randomUUID(), campaignId: campaign.id, type: 'Follow-up',
          title: `Assessment Tindak Lanjut ${campaign.name}`, status: 'Locked',
          dueDate: campaign.endDate || dueDate,
        });
      }
      if (campaign.simulation) {
        state.simulations.unshift({
          id: randomUUID(), campaignId: campaign.id, template: campaign.simulation,
          status: 'Scheduled', delivered: 0, opened: 0, clicked: 0,
          credentialAttempted: 0, reported: 0, noAction: 0,
        });
      }
      const startsAt = campaign.startDate ? new Date(campaign.startDate) : null;
      campaign.status = startsAt && !Number.isNaN(startsAt.getTime()) && startsAt.getTime() > Date.now() ? 'Scheduled' : 'Active';
      state.assignments.unshift(...newAssignments);
      state.assessments.unshift(...newAssessments);
      state.notifications.unshift({
        id: randomUUID(), type: 'Assignment',
        message: campaign.status === 'Scheduled'
          ? `${campaign.name}: ${newAssignments.length} learning dijadwalkan`
          : `${campaign.name}: ${newAssignments.length} learning baru ditugaskan`,
        status: 'Delivered', date: formatDate(),
      });
      state.events.unshift(makeEvent('campaign.launched', campaign.name, actor));
      result = { assignmentsCreated: newAssignments.length };
      break;
    }
    case 'assignLearning': {
      const assignment = {
        ...payload.assignment, id: randomUUID(), createdAt: formatDate(),
        required: payload.assignment.required ?? true, progress: 0, status: 'Not Started',
      };
      state.assignments.unshift(assignment);
      state.notifications.unshift({
        id: randomUUID(), type: 'Assignment',
        message: `${assignment.courseTitle} ditugaskan kepada ${assignment.audience}`,
        status: 'Delivered', date: formatDate(),
      });
      state.events.unshift(makeEvent('learning.assigned', assignment.courseTitle, actor));
      result = { id: assignment.id };
      break;
    }
    case 'startLearning': {
      const assignment = requireAssignment(state, payload.courseId, actor, payload.campaignId);
      if (!assignment) throw Object.assign(new Error('Learning tidak ditugaskan kepada Anda.'), { status: 403, code: 'ASSIGNMENT_REQUIRED' });
      if (assignment.status === 'Not Started') {
        assignment.status = 'In Progress';
        assignment.progress = 1;
        state.events.unshift(makeEvent('learning.started', payload.courseId, actor));
      }
      break;
    }
    case 'updateLearningProgress': {
      const assignment = requireAssignment(state, payload.courseId, actor, payload.campaignId);
      if (!assignment) throw Object.assign(new Error('Learning tidak ditugaskan kepada Anda.'), { status: 403, code: 'ASSIGNMENT_REQUIRED' });
      if (assignment.status !== 'Completed') {
        assignment.progress = payload.progress;
        assignment.status = payload.progress >= 100 ? 'Quiz Available' : 'In Progress';
      }
      break;
    }
    case 'completeLearningContent': {
      const assignment = requireAssignment(state, payload.courseId, actor, payload.campaignId);
      if (!assignment) throw Object.assign(new Error('Learning tidak ditugaskan kepada Anda.'), { status: 403, code: 'ASSIGNMENT_REQUIRED' });
      assignment.status = 'Quiz Available';
      assignment.progress = 100;
      state.events.unshift(makeEvent('learning.completed', payload.courseId, actor));
      break;
    }
    case 'completePhishingQuiz':
    case 'completeModuleQuiz': {
      const courseId = action === 'completePhishingQuiz' ? 'phishing-awareness' : payload.courseId;
      const score = action === 'completePhishingQuiz' ? 87 : payload.score;
      const answers = action === 'completePhishingQuiz' ? [] : (payload.answers || []);
      const assignment = requireAssignment(state, courseId, actor, payload.campaignId);
      if (!assignment) throw Object.assign(new Error('Quiz tidak tersedia untuk akun ini.'), { status: 403, code: 'ASSIGNMENT_REQUIRED' });
      const passed = score >= 70;
      assignment.status = passed ? 'Completed' : 'Quiz Available';
      assignment.quizScore = score;
      assignment.progress = 100;

      const campaignIds = [...new Set(state.assignments
        .filter((item) => item.courseId === courseId && relevant(item.audience, actor))
        .map((item) => item.campaignId).filter(Boolean))];
      for (const assessment of state.assessments) {
        if (assessment.type !== 'Follow-up' || !campaignIds.includes(assessment.campaignId)) continue;
        const requiredAssignments = state.assignments.filter((item) => item.campaignId === assessment.campaignId && item.required && relevant(item.audience, actor));
        if (requiredAssignments.length && requiredAssignments.every((item) => item.status === 'Completed')) assessment.status = 'Available';
      }

      if (passed && !state.certificates.some((item) => item.courseId === courseId && item.employeeName === actor.name)) {
        const certificate = {
          id: `AVERIS-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          courseId, courseTitle: courseById(courseId)?.title || courseId,
          employeeName: actor.name, score, issuedAt: formatDate(), status: 'Issued',
        };
        state.certificates.unshift(certificate);
        state.notifications.unshift({
          id: randomUUID(), type: 'Certificate',
          message: `Sertifikat ${certificate.courseTitle} diterbitkan`,
          status: 'Delivered', date: formatDate(),
        });
      }

      state.scoreSignals.knowledge = Math.round((state.scoreSignals.knowledge + score) / 2);
      if (passed) state.scoreSignals.improvement = Math.min(100, state.scoreSignals.improvement + 2);
      const calculatedScore = scoreFrom(state.scoreSignals);
      state.employeeScore = calculatedScore;
      state.organizationScore = calculatedScore;
      state.quizCompleted = courseId === 'phishing-awareness' && passed ? true : state.quizCompleted;
      state.quizAttempts = [
        { courseId, campaignId: assignment.campaignId, answers, score, completedAt: formatDate(), employeeName: actor.name },
        ...state.quizAttempts.filter((item) => !(item.courseId === courseId && item.campaignId === assignment.campaignId && item.employeeName === actor.name)),
      ];
      for (const campaign of state.campaigns) {
        const assignments = state.assignments.filter((item) => item.campaignId === campaign.id && item.required);
        if (assignments.length) campaign.completion = Math.round(assignments.filter((item) => item.status === 'Completed').length / assignments.length * 100);
      }
      state.events.unshift(makeEvent(passed ? 'quiz.passed' : 'quiz.failed', `${courseId}: ${score}`, actor));
      result = { passed, score };
      break;
    }
    case 'startAssessment': {
      const assessment = state.assessments.find((item) => item.id === payload.id);
      if (!assessment) throw Object.assign(new Error('Assessment tidak ditemukan.'), { status: 404, code: 'ASSESSMENT_NOT_FOUND' });
      if (assessment.status !== 'Available') throw Object.assign(new Error('Assessment belum tersedia.'), { status: 409, code: 'ASSESSMENT_UNAVAILABLE' });
      assessment.status = 'In Progress';
      state.events.unshift(makeEvent('assessment.started', assessment.title, actor));
      result = { started: true };
      break;
    }
    case 'completeAssessment': {
      const assessment = state.assessments.find((item) => item.id === payload.id)
        || state.assessments.find((item) => ['In Progress', 'Available'].includes(item.status));
      if (!assessment) throw Object.assign(new Error('Assessment aktif tidak ditemukan.'), { status: 404, code: 'ASSESSMENT_NOT_FOUND' });
      assessment.status = 'Completed';
      assessment.score = payload.score;
      state.assessmentResult = payload.score;
      state.scoreSignals.knowledge = payload.score;
      if (assessment.type === 'Follow-up') state.scoreSignals.improvement = Math.min(100, state.scoreSignals.improvement + 5);
      const calculatedScore = scoreFrom(state.scoreSignals);
      state.employeeScore = calculatedScore;
      state.organizationScore = calculatedScore;
      const campaign = state.campaigns.find((item) => item.id === assessment.campaignId);
      if (campaign) {
        if (assessment.type === 'Baseline') campaign.baseline = payload.score;
        else campaign.score = calculatedScore;
      }
      state.notifications.unshift({
        id: randomUUID(), type: 'Assessment', message: `${assessment.title} selesai dengan skor ${payload.score}`,
        status: 'Delivered', date: formatDate(),
      });
      state.events.unshift(makeEvent('assessment.completed', assessment.title, actor));
      result = { score: calculatedScore };
      break;
    }
    case 'recordSimulationEvent': {
      const simulation = state.simulations.find((item) => item.campaignId === payload.campaignId);
      if (!simulation) throw Object.assign(new Error('Simulasi tidak ditemukan.'), { status: 404, code: 'SIMULATION_NOT_FOUND' });
      simulation.status = 'Active';
      simulation[payload.event] += 1;
      if (payload.event === 'reported') {
        state.scoreSignals.behavior = Math.min(100, state.scoreSignals.behavior + 2);
        state.scoreSignals.reporting = Math.min(100, state.scoreSignals.reporting + 2);
        state.phishingReports += 1;
      } else if (['clicked', 'credentialAttempted'].includes(payload.event)) {
        state.scoreSignals.behavior = Math.max(0, state.scoreSignals.behavior - 2);
      }
      state.organizationScore = scoreFrom(state.scoreSignals);
      state.events.unshift(makeEvent(`simulation.${payload.event}`, payload.campaignId, actor));
      break;
    }
    case 'reportPhishing': {
      state.phishingReports += 1;
      state.scoreSignals.reporting = Math.min(100, state.scoreSignals.reporting + 1);
      state.organizationScore = scoreFrom(state.scoreSignals);
      state.events.unshift(makeEvent('phishing.reported', 'Suspicious message reported', actor));
      break;
    }
    case 'resetDemo': {
      return { state: createInitialProductState(), result: { reset: true } };
    }
    default:
      throw Object.assign(new Error('Action tidak didukung.'), { status: 404, code: 'UNKNOWN_ACTION' });
  }

  return { state, result };
}
