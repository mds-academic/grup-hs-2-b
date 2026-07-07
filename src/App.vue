<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import { courseData } from './courseData.js';
import { getProject, types } from '@theatre/core';

const theatreState = {
  "revisionHistory": [],
  "definitionVersion": "0.4.0",
  "sheetsById": {
    "QuizSheet": {
      "sequence": {
        "type": "PositionalSequence",
        "length": 1,
        "tracksByObject": {
          "QuizOverlay": {
            "trackDataByPropertyPath": {
              "y": {
                "type": "BasicKeyframedTrack",
                "keyframes": [
                  { "id": "k1", "position": 0, "value": 80, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k1b", "position": 0.3, "value": -15, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k2", "position": 0.45, "value": 0, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] }
                ]
              },
              "opacity": {
                "type": "BasicKeyframedTrack",
                "keyframes": [
                  { "id": "k3", "position": 0, "value": 0, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k4", "position": 0.25, "value": 1, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] }
                ]
              },
              "scale": {
                "type": "BasicKeyframedTrack",
                "keyframes": [
                  { "id": "k5", "position": 0, "value": 0.8, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k5b", "position": 0.3, "value": 1.05, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k6", "position": 0.45, "value": 1, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] }
                ]
              }
            }
          }
        }
      }
    }
  }
};
const proj = getProject('LMSProject', { state: theatreState });
const sheet = proj.sheet('QuizSheet');
const quizObj = sheet.object('QuizOverlay', { y: 50, opacity: 0, scale: 0.95 });
const quizModalStyles = ref({ transform: 'translateY(50px) scale(0.95)', opacity: 0, display: 'none' });


// Reactive App States
const currentStep = ref(1);
const totalSteps = Object.keys(courseData).length;
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz58EffczfpcNL0bvbD6VZvrY3mrVNtmpWasSwJT0baOowD2yGu_KNM0YNul9EtxxKVpg/exec';
const isLoggedIn = ref(false);
const loginSchool = ref('');
const loginEmail = ref('');
const selectedSchool = ref('');
const isLoggingIn = ref(false);
const showLoginError = ref(false);
const loginErrorTitle = ref('');
const loginErrorMessage = ref('');
const dashboardNotice = reactive({
  isOpen: false,
  type: 'warning',
  title: '',
  message: '',
  actionLabel: 'Mengerti'
});
const dashboardNoticeIcon = computed(() => ({
  success: 'OK',
  warning: '!',
  error: '!'
})[dashboardNotice.type] || '!');
const showDashboardNotice = ({ type = 'warning', title = 'Perhatian', message = '', actionLabel = 'Mengerti' } = {}) => {
  dashboardNotice.type = type;
  dashboardNotice.title = title;
  dashboardNotice.message = message;
  dashboardNotice.actionLabel = actionLabel;
  dashboardNotice.isOpen = true;
};
const closeDashboardNotice = () => {
  dashboardNotice.isOpen = false;
};
const schoolOptions = ref([]);
const isSchoolLoading = ref(false);
const isSchoolDropdownOpen = ref(false);
const loginEmailAttempts = ref(0);
const loginEmailSuggestion = ref(null);
const emailHelpOpen = ref(false);
const emailHelpQuery = ref('');
const emailHelpResults = ref([]);
const isEmailHelpLoading = ref(false);

const showProfileMenu = ref(false);

const isDesktop = ref(window.innerWidth > 1024);
const updateWidth = () => { isDesktop.value = window.innerWidth > 1024; };
let schoolSearchTimer = null;
let schoolSearchRequestId = 0;

const studentData = ref({ name: '', school: '', email: '' });
const studentProgress = ref({}); // Menyimpan progress jawaban & attempts

// Tambahkan auto-ID ke semua soal agar gampang ditrack
Object.keys(courseData).forEach(stepId => {
  let qCounter = 1;
  courseData[stepId].quizzes?.forEach(quiz => {
    quiz.questions.forEach(q => {
      q.qid = `V${stepId}_Q${qCounter}`;
      qCounter++;
    });
  });
});

const saveProgress = (key, value) => {
  studentProgress.value[key] = value;
  localStorage.setItem('mds_student_progress', JSON.stringify(studentProgress.value));
  syncToSheets();
};

const markQuestionFailed = (qid) => {
  if (!qid) return;
  studentProgress.value[`${qid}_Ans`] = '0';
  studentProgress.value[`${qid}_Score`] = 0;
  studentProgress.value[`${qid}_Failed`] = true;
  localStorage.setItem('mds_student_progress', JSON.stringify(studentProgress.value));
  syncToSheets();
};

const syncToSheets = async () => {
  if (!isLoggedIn.value) return;
  const payload = {
    Students_Email: studentData.value.email,
    Students_Name: studentData.value.name,
    Students_School: studentData.value.school,
    Group: 'ghs2b',
    ...studentProgress.value
  };
  try {
    await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' } // text/plain untuk bypass CORS AppScript
    });
  } catch(err) {
    console.error("Sync error", err);
  }
};

const handleLogin = async () => {
  if (!selectedSchool.value || !loginEmail.value.trim()) {
    loginErrorTitle.value = 'Lengkapi dulu ya';
    loginErrorMessage.value = 'Pilih sekolah, lalu masukkan email yang terdaftar di Akademia Ruangguru.';
    showLoginError.value = true;
    return;
  }
  
  isLoggingIn.value = true;
  showLoginError.value = false;
  loginEmailSuggestion.value = null;

  try {
    const nextAttempt = loginEmailAttempts.value + 1;
    const params = new URLSearchParams({
      action: 'login',
      school: selectedSchool.value,
      email: loginEmail.value,
      attempts: String(nextAttempt)
    });
    const res = await fetch(`${APP_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      studentData.value = { name: data.name, school: data.school, email: data.email };
      isLoggedIn.value = true;
      loginEmailAttempts.value = 0;
      localStorage.setItem('mds_student_login', JSON.stringify(studentData.value));
    } else {
      loginEmailAttempts.value = nextAttempt;
      loginErrorTitle.value = data.needsRfo ? 'Perlu bantuan RFO' : 'Email belum cocok';
      loginErrorMessage.value = data.message || 'Email ini belum cocok dengan data Akademia Ruangguru untuk sekolah yang dipilih. Coba cek lagi penulisannya ya.';
      loginEmailSuggestion.value = data.suggestion || null;
      showLoginError.value = true;
    }
  } catch (err) {
    console.error("Login error", err);
    loginErrorTitle.value = 'Belum bisa masuk';
    loginErrorMessage.value = 'Koneksi ke data siswa belum berhasil. Coba lagi sebentar ya.';
    showLoginError.value = true;
  } finally {
    isLoggingIn.value = false;
  }
};

const fetchSchoolOptions = async (query = loginSchool.value) => {
  const requestId = ++schoolSearchRequestId;
  isSchoolLoading.value = true;
  try {
    const params = new URLSearchParams({ action: 'schools', query });
    const res = await fetch(`${APP_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();
    if (requestId === schoolSearchRequestId && data.success) schoolOptions.value = data.schools || [];
  } catch (err) {
    console.error("School search error", err);
  } finally {
    if (requestId === schoolSearchRequestId) isSchoolLoading.value = false;
  }
};

const fetchEmailHelpResults = async (query = emailHelpQuery.value) => {
  if (!selectedSchool.value || !query.trim()) {
    emailHelpResults.value = [];
    return;
  }
  isEmailHelpLoading.value = true;
  try {
    const params = new URLSearchParams({ action: 'students', school: selectedSchool.value, query });
    const res = await fetch(`${APP_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();
    if (data.success) emailHelpResults.value = data.students || [];
  } catch (err) {
    console.error("Email help search error", err);
  } finally {
    isEmailHelpLoading.value = false;
  }
};

const handleSchoolInput = () => {
  selectedSchool.value = '';
  loginEmail.value = '';
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
  isSchoolDropdownOpen.value = true;
  loginEmailAttempts.value = 0;
  loginEmailSuggestion.value = null;
  showLoginError.value = false;
  if (schoolSearchTimer) clearTimeout(schoolSearchTimer);
  schoolSearchTimer = setTimeout(() => fetchSchoolOptions(), 250);
};

const handleEmailInput = () => {
  loginEmailSuggestion.value = null;
  showLoginError.value = false;
};

const handleEmailHelpInput = () => {
  fetchEmailHelpResults();
};

const openSchoolDropdown = () => {
  isSchoolDropdownOpen.value = true;
  fetchSchoolOptions('');
};

const closeSchoolDropdownSoon = () => {
  setTimeout(() => {
    isSchoolDropdownOpen.value = false;
  }, 120);
};

const selectSchool = (school) => {
  loginSchool.value = school;
  selectedSchool.value = school;
  loginEmail.value = '';
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
  isSchoolDropdownOpen.value = false;
  loginEmailAttempts.value = 0;
  loginEmailSuggestion.value = null;
  showLoginError.value = false;
};

const toggleEmailHelp = () => {
  emailHelpOpen.value = !emailHelpOpen.value;
  if (!emailHelpOpen.value) return;
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
};


onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
});

const handleLogout = () => {
  localStorage.removeItem('mds_student_login');
  isLoggedIn.value = false;
  loginSchool.value = '';
  loginEmail.value = '';
  selectedSchool.value = '';
  isSchoolDropdownOpen.value = false;
  loginEmailAttempts.value = 0;
  loginEmailSuggestion.value = null;
  emailHelpOpen.value = false;
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
  studentData.value = { email: '', name: '', school: '' };
};


onMounted(() => {
  window.addEventListener('resize', updateWidth);

  const savedLogin = localStorage.getItem('mds_student_login');
  if (savedLogin) {
    studentData.value = JSON.parse(savedLogin);
    isLoggedIn.value = true;
  }
  const savedProgress = localStorage.getItem('mds_student_progress');
  if (savedProgress) {
    studentProgress.value = JSON.parse(savedProgress);
  }
});

const videoWatchedStatus = ref({
  1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false
});

const youtubeReady = ref(false);
const players = {};
const timeCheckers = {};

const playerStates = ref({
  1: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  2: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  3: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  4: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  5: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  6: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  7: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  8: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
});

const introRefs = ref({});
const introPlayed = ref({});
const introVideoSrc = import.meta.env.BASE_URL + 'intro.mp4';


const isFullscreen = ref(false);
const videoContainers = ref({});

// Quiz Overlay States
const quizState = ref({
  isOpen: false,
  shuffledQuestions: [],
  currentQuestionIdx: 0,
  resumeVideoAfterQuiz: false,
  resumeVideoTime: null,
  quizFeedback: '',
  quizFeedbackType: '',
  essayAnswer: '',
  isNextBtnVisible: false,
  nextBtnText: 'Soal berikutnya →',
  activeQuizConfig: null,
  activeQuizStep: null,
  replayingQuizVideo: false,
  replayCheckpointArmed: false,
  choicesDisabled: false,
  inputAnswer: '',
  selectedChoice: null
});

const quizReturn = ref({
  isVisible: false
});

const showCompletionToast = ref(false);
const failedAttempts = ref({});

// Time formatting helper
const formatVideoTime = (value) => {
  const totalSeconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return minutes + ":" + seconds;
};

const getBookmarks = (stepId) => {
  return courseData[stepId]?.bookmarks || [];
};

const getVideoStartBoundary = (stepId) => {
  return courseData[stepId]?.startSeconds || 0;
};

// Seek boundary enforcement
const enforceVideoStartBoundary = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getCurrentTime !== "function" || typeof player.seekTo !== "function") return;
  const currentTime = player.getCurrentTime();
  const startBoundary = getVideoStartBoundary(stepId);

  if (startBoundary > 0 && currentTime < startBoundary - 0.5) {
    player.seekTo(startBoundary, true);
  }
};

const restartVideoFromBoundary = (stepId, shouldPlay = true) => {
  const player = players[stepId];
  if (!player || typeof player.seekTo !== "function") return;

  const startBoundary = getVideoStartBoundary(stepId);
  player.seekTo(startBoundary, true);
  playerStates.value[stepId].currentTime = 0;
  playerStates.value[stepId].progress = 0;

  if (shouldPlay && typeof player.playVideo === "function") {
    player.playVideo();
  }
};

const enforceVideoEndBoundary = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getCurrentTime !== "function") return;

  const endBoundary = courseData[stepId]?.endSeconds;
  if (endBoundary > 0 && player.getCurrentTime() >= endBoundary) {
    restartVideoFromBoundary(stepId);
    return true;
  }

  return false;
};

const updateVideoControls = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getCurrentTime !== "function") return;

  const startBoundary = getVideoStartBoundary(stepId);
  const endBoundary = courseData[stepId]?.endSeconds;
  
  const rawDuration = endBoundary || player.getDuration() || 0;
  const duration = Math.max(0, rawDuration - startBoundary);
  
  const rawCurrentTime = player.getCurrentTime() || 0;
  const currentTime = Math.max(0, rawCurrentTime - startBoundary);

  playerStates.value[stepId].duration = duration;
  playerStates.value[stepId].currentTime = currentTime;
  playerStates.value[stepId].progress = duration > 0 ? (currentTime / duration * 100) : 0;
  playerStates.value[stepId].durationFormatted = formatVideoTime(duration);
  playerStates.value[stepId].currentTimeFormatted = formatVideoTime(currentTime);
};

// Video actions
const playVideo = (stepId) => {
  playerStates.value[stepId].hasStarted = true;
  const player = players[stepId];
  if (!player || typeof player.getPlayerState !== "function") {
    initializeYouTubePlayer(stepId);
    // YouTube player onReady will not autoplay unless we tell it to,
    // but the player itself is now visible so the user can click it or we can play it if ready.
    setTimeout(() => {
      if (players[stepId] && typeof players[stepId].playVideo === 'function') {
         players[stepId].playVideo();
      }
    }, 500);
    return;
  }
  player.playVideo();
};

const playIntroThenVideo = async (stepId) => {
  const introEl = introRefs.value[stepId];
  if (introEl && !introPlayed.value[stepId]) {
    playerStates.value[stepId].introPlaying = true;
    playerStates.value[stepId].hasStarted = true;
    await nextTick();
    introEl.currentTime = 0;
    introEl.play().catch(e => {
      console.error("Intro video play error:", e);
      onIntroEnded(stepId);
    });
  } else {
    onIntroEnded(stepId);
  }
};

const onIntroEnded = (stepId) => {
  playerStates.value[stepId].introPlaying = false;
  introPlayed.value[stepId] = true;
  
  const player = players[stepId];
  if (!player || typeof player.getPlayerState !== "function") {
    initializeYouTubePlayer(stepId);
    setTimeout(() => {
      if (players[stepId] && typeof players[stepId].playVideo === 'function') {
         players[stepId].playVideo();
      }
    }, 500);
  } else {
    player.playVideo();
  }
};

const togglePlay = (stepId) => {
  if (playerStates.value[stepId] && !introPlayed.value[stepId]) {
    playIntroThenVideo(stepId);
    return;
  }
  const player = players[stepId];
  if (!player || typeof player.getPlayerState !== "function") {
    initializeYouTubePlayer(stepId);
    return;
  }
  if (playerStates.value[stepId].isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
};

const toggleMute = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.isMuted !== "function") return;
  if (player.isMuted()) {
    player.unMute();
    playerStates.value[stepId].isMuted = false;
  } else {
    player.mute();
    playerStates.value[stepId].isMuted = true;
  }
};

const onSeekInput = (stepId, event) => {
  const player = players[stepId];
  if (!player || typeof player.seekTo !== "function") return;
  const startBoundary = getVideoStartBoundary(stepId);
  const duration = playerStates.value[stepId].duration || 0;
  const requestedRelativeTime = (duration * Number(event.target.value)) / 100;
  player.seekTo(startBoundary + requestedRelativeTime, true);
};

const toggleFullscreen = (stepId) => {
  const el = document.querySelector(`.video-frame[data-video-step="${stepId}"]`);
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    el.requestFullscreen();
  }
};

const seekToBookmark = (stepId, time) => {
  const player = players[stepId];
  if (player && typeof player.seekTo === "function") {
    player.seekTo(time, true);
    if (typeof player.playVideo === "function") player.playVideo();
    
    const container = videoContainers.value[stepId];
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
};

// YouTube player setup
const initializeYouTubePlayer = (stepId) => {
  const normalizedStepId = String(stepId);
  if (!youtubeReady.value || players[normalizedStepId] || !courseData[normalizedStepId]) return;

  const playerId = "youtube-player-" + normalizedStepId;
  const domEl = document.getElementById(playerId);
  if (!domEl) return;

  playerStates.value[normalizedStepId].isError = false;

  players[normalizedStepId] = new window.YT.Player(playerId, {
    videoId: courseData[normalizedStepId].videoId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      controls: 0,
      vq: 'hd1080',
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      start: courseData[normalizedStepId].startSeconds || 0,
      origin: window.location.origin
    },
    events: {
      onReady: (event) => {
        const iframe = event.target.getIframe();
        iframe.removeAttribute("allowfullscreen");
        iframe.setAttribute("tabindex", "-1");
        iframe.setAttribute("aria-hidden", "true");
        
        playerStates.value[normalizedStepId].isReady = true;
        playerStates.value[normalizedStepId].duration = event.target.getDuration() || 0;
        
        event.target.setPlaybackQuality('hd1080');
        enforceVideoStartBoundary(normalizedStepId);
        updateVideoControls(normalizedStepId);
      },
      onError: () => {
        playerStates.value[normalizedStepId].isError = true;
      },
      onStateChange: (event) => handlePlayerStateChange(normalizedStepId, event)
    }
  });
};

const handlePlayerStateChange = (stepId, event) => {
  const isPlaying = event.data === window.YT.PlayerState.PLAYING;
  const isBuffering = event.data === window.YT.PlayerState.BUFFERING;
  playerStates.value[stepId].isBuffering = isBuffering;
  playerStates.value[stepId].isPlaying = isPlaying;

  if (isPlaying) {
    playerStates.value[stepId].hasStarted = true;
    enforceVideoStartBoundary(stepId);
  }

  if (event.data === window.YT.PlayerState.ENDED) {
    videoWatchedStatus.value[stepId] = true;
    if (checkVideoQuizzes(stepId)) return;
    restartVideoFromBoundary(stepId);
    return;
  }

  updateVideoControls(stepId);

  window.clearInterval(timeCheckers[stepId]);
  if (isPlaying) {
    timeCheckers[stepId] = window.setInterval(() => {
      updateVideoControls(stepId);
      const quizOpened = checkVideoQuizzes(stepId);
      if (!quizOpened) {
        enforceVideoStartBoundary(stepId);
        enforceVideoEndBoundary(stepId);
      }
    }, 300);
  }
};

const checkVideoQuizzes = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getCurrentTime !== 'function') return;

  const currentTime = player.getCurrentTime();
  const stepConfig = courseData[stepId];
  if (!stepConfig || !stepConfig.quizzes) return;

  for (let quiz of stepConfig.quizzes) {
    if (quizState.value.replayingQuizVideo && quiz === quizState.value.activeQuizConfig) {
      if (currentTime < quiz.time - 0.5) {
        quizState.value.replayCheckpointArmed = true;
      }
      if (!quizState.value.replayCheckpointArmed) continue;
    }

    if (!quiz.shown && currentTime >= quiz.time) {
      quiz.shown = true;
      player.pauseVideo();
      window.clearInterval(timeCheckers[stepId]);

      const shouldResume = quiz.resume !== undefined ? quiz.resume : true;
      openQuiz(quiz.questions, shouldResume, quiz.resumeTime, quiz, stepId);
      return true;
    }
  }

  return false;
};

// Quiz Functions
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }
  return result;
};

const openQuiz = (questionsArray, shouldResume = false, seekTime = null, quizConfig = null, stepId = currentStep.value) => {
  try {
    if (document.fullscreenElement) {
      const exitPromise = document.exitFullscreen();
      if (exitPromise !== undefined) exitPromise.catch(e => console.log(e));
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } catch (err) {
    console.log('Exit fullscreen error:', err);
  }

  if (quizConfig) {
    quizState.value.activeQuizConfig = quizConfig;
    quizState.value.activeQuizStep = Number(stepId);
  } else {
    quizState.value.activeQuizConfig = null;
    quizState.value.activeQuizStep = null;
  }

  quizState.value.replayingQuizVideo = false;
  quizState.value.replayCheckpointArmed = false;
  quizReturn.value.isVisible = false;

  quizState.value.resumeVideoAfterQuiz = shouldResume;
  quizState.value.resumeVideoTime = seekTime;

  quizState.value.shuffledQuestions = shuffle([...questionsArray]);
  quizState.value.currentQuestionIdx = 0;
  quizState.value.isOpen = true;
  sheet.sequence.play({ direction: 'normal', range: [0, 0.4] });
  quizState.value.choicesDisabled = false;
  quizState.value.selectedChoice = null;
  quizState.value.quizFeedback = '';
  quizState.value.quizFeedbackType = '';
  quizState.value.essayAnswer = '';
  quizState.value.inputAnswer = '';
  quizState.value.isNextBtnVisible = false;
  quizState.value.nextBtnText = 'Soal berikutnya →';

  nextTick(() => {
    renderQuestion();
  });
};

const closeQuiz = (resumeVideo = false, seekTime = null) => {
  sheet.sequence.play({ direction: 'reverse', range: [0, 0.4] }).then(() => {
    quizState.value.isOpen = false;
  });
  if (resumeVideo && players[currentStep.value]) {
    const player = players[currentStep.value];
    if (seekTime !== null && typeof player.seekTo === "function") {
      player.seekTo(seekTime, true);
    }
    if (typeof player.playVideo === "function") {
      player.playVideo();
    }
  }
};

const currentQuestion = computed(() => {
  const questions = quizState.value.shuffledQuestions;
  const idx = quizState.value.currentQuestionIdx;
  if (questions && questions.length > 0 && idx < questions.length) {
    return questions[idx];
  }
  return null;
});

const getQuestionChoices = (question) => {
  if (!question) return [];
  if (Array.isArray(question.choices) && question.choices.length > 0) return question.choices;
  if (typeof question.answer === "boolean") return ["True", "False"];
  return [];
};

const isQuizFinished = computed(() => {
  return quizState.value.shuffledQuestions.length > 0 && 
         quizState.value.currentQuestionIdx >= quizState.value.shuffledQuestions.length;
});

const attachCustomHtmlListeners = () => {
  setTimeout(() => { // ensure DOM is fully updated
    document.querySelectorAll('.answer-opt-btn').forEach(btn => {
      btn.onclick = function() {
        this.innerHTML = "Memeriksa...";
        const isCorrect = this.getAttribute('data-correct') === 'true';
        const expl = this.getAttribute('data-explanation');
        if (window.checkGuess) window.checkGuess(this, isCorrect, expl);
      };
    });

    const wrapHandler = (btnId, handlerFn) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = function() {
          const originalText = this.innerHTML;
          this.innerHTML = "Memeriksa...";
          handlerFn(this);
          // Restore text after 1 second if still enabled
          setTimeout(() => { if (!this.disabled) this.innerHTML = originalText; }, 1000);
        };
      }
    };

    wrapHandler('mb1-check-btn', (btn) => {
      const kw = document.getElementById('mb1-kw');
      const cond = document.getElementById('mb1-cond');
      if (window.checkMB1QGuess) window.checkMB1QGuess(kw ? kw.value : '', cond ? cond.value : '', btn, 'Syarat yang benar adalah elif dan age < 18.');
    });
    wrapHandler('mb2-check-btn', (btn) => {
      const v1 = document.getElementById('mb2-val1');
      const v2 = document.getElementById('mb2-val2');
      if (window.checkMB2QGuess) window.checkMB2QGuess(v1 ? v1.value : '', v2 ? v2.value : '', btn, 'Kondisi yang lebih ketat harus ditaruh di atas!');
    });
    wrapHandler('paren-check-btn', (btn) => {
      const input = document.getElementById('paren-input');
      if (window.checkParenGuess) window.checkParenGuess(input ? input.value : '', btn, 'Kita harus mengevaluasi or di dalam kurung terlebih dahulu.');
    });
    wrapHandler('and-check-btn', (btn) => {
      const input = document.getElementById('and-input');
      if (window.checkAndGuess) window.checkAndGuess(input ? input.value : '', btn, 'Kedua syarat harus terpenuhi untuk mendapatkan beasiswa.');
    });
    wrapHandler('or-check-btn', (btn) => {
      const input = document.getElementById('or-input');
      if (window.checkOrGuess) window.checkOrGuess(input ? input.value : '', btn, 'Salah satu syarat harus terpenuhi.');
    });
    wrapHandler('logical-check-btn', (btn) => {
      const input = document.getElementById('logical-input');
      if (window.checkNestedToLogicalGuess) window.checkNestedToLogicalGuess(input ? input.value : '', btn, 'Dengan operator and kita bisa menggabungkan dua if bersarang.');
    });
    wrapHandler('needs-check-btn', (btn) => {
      if (window.checkNeedsWantsGuess) window.checkNeedsWantsGuess('needs-input', btn);
    });
    wrapHandler('wants-check-btn', (btn) => {
      if (window.checkNeedsWantsGuess) window.checkNeedsWantsGuess('wants-input', btn);
    });
    wrapHandler('ide6-run-btn', (btn) => {
      if (window.runPyodideCode) window.runPyodideCode('python-ide-6', 'ide-output-6');
    });
    wrapHandler('ide6-submit-btn', (btn) => {
      if (window.checkIde6Guess) window.checkIde6Guess(btn);
    });
  }, 100);
};

const renderQuestion = () => {
  if (currentQuestion.value && !currentQuestion.value.html) {
    nextTick(() => {
      const trueBtn = document.querySelector('.choice-btn.true-btn');
      if (trueBtn) trueBtn.focus();
    });
  } else if (currentQuestion.value && currentQuestion.value.html) {
    nextTick(() => {
      attachCustomHtmlListeners();
    });
  }
};

const revealQuizNext = (label = "Soal berikutnya →") => {
  quizState.value.nextBtnText = label;
  quizState.value.isNextBtnVisible = true;
  
  nextTick(() => {
    const nextBtn = document.querySelector('.quiz-next-btn');
    if (nextBtn) {
      nextBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      nextBtn.focus({ preventScroll: true });
    }
  });
};

const registerFailedInputAttempt = (btn, feedbackEl) => {
  const key = btn.id || btn.className || 'default-btn';
  const attempts = (failedAttempts.value[key] || 0) + 1;
  failedAttempts.value[key] = attempts;
  quizState.value.isNextBtnVisible = false;

  const attemptStatus = document.createElement("div");
  attemptStatus.className = "attempt-status";

  if (attempts >= 3) {
    attemptStatus.classList.add("limit-reached");
    markQuestionFailed(currentQuestion.value?.qid);
    attemptStatus.innerHTML = "<strong>Sudah 3 kali salah.</strong><br>Nilai checkpoint ini menjadi 0 dan modul berikutnya tetap terkunci.";
    btn.disabled = true;
    btn.style.opacity = "0.55";
  } else {
    attemptStatus.textContent = "Jawabanmu belum tepat. Coba cek lagi perlahan dan perhatikan petunjuk dari video.";
  }

  feedbackEl.appendChild(attemptStatus);
};

const registerTypedWrongAttempt = (question, answerValue = "") => {
  const key = question?.qid || question?.title || question?.question || "typed-question";
  const attempts = (failedAttempts.value[key] || 0) + 1;
  failedAttempts.value[key] = attempts;

  if (attempts >= 3) {
    if (question?.qid) {
      markQuestionFailed(question.qid);
    }
    quizState.value.choicesDisabled = true;
    quizState.value.quizFeedbackType = "wrong";
    quizState.value.quizFeedback = "<strong>Sudah 3 kali mencoba.</strong><br>Kamu boleh lanjut dulu. Perhatikan lagi videonya sebelum masuk ke bagian berikutnya, ya.";
    return true;
  }

  quizState.value.choicesDisabled = false;
  return false;
};

const handleStandardAnswer = (answer) => {
  const item = currentQuestion.value;
  if (!item) return;
  if (quizState.value.choicesDisabled) return;

  const expectedAnswer = item.answer ?? item.correct;
  const normalizedAnswer = typeof answer === "string" ? answer.trim().toLowerCase() : answer;
  const normalizedExpected = typeof expectedAnswer === "string" ? expectedAnswer.trim().toLowerCase() : expectedAnswer;
  const isCorrect = normalizedAnswer === normalizedExpected;
  
  quizState.value.selectedChoice = answer;
  
  let attempts = 0;
  if (item.qid) {
    const attKey = `${item.qid}_Att`;
    attempts = (studentProgress.value[attKey] || 0) + 1;
    studentProgress.value[attKey] = attempts;
    saveProgress(attKey, attempts);
  } else {
    attempts = (failedAttempts.value[item.question] || 0) + 1;
    failedAttempts.value[item.question] = attempts;
  }

  if (isCorrect) {
    quizState.value.choicesDisabled = true;
    quizState.value.quizFeedbackType = 'correct';
    quizState.value.quizFeedback = "Tepat. " + (item.explanation || "");
    if (item.qid) {
      const ansKey = `${item.qid}_Ans`;
      studentProgress.value[ansKey] = String(answer);
      saveProgress(ansKey, studentProgress.value[ansKey]);
    }
    revealQuizNext();
  } else {
    quizState.value.quizFeedbackType = 'wrong';
    if (attempts >= 3) {
      quizState.value.choicesDisabled = true;
      if (item.qid) {
        markQuestionFailed(item.qid);
      }
      quizState.value.quizFeedback = "Sudah 3 kali salah. Nilai checkpoint ini menjadi 0 dan modul berikutnya tetap terkunci.";
    } else {
      quizState.value.quizFeedback = `Belum tepat. Coba cek lagi perlahan dan perhatikan petunjuk dari video. (Percobaan ${attempts}/3)`;
      setTimeout(() => {
        if (!quizState.value.choicesDisabled) {
          quizState.value.selectedChoice = null;
        }
      }, 2000);
    }
  }
};

const submitInputAnswer = () => {
  const item = currentQuestion.value;
  if (!item || item.type !== 'input') return;

  const input = quizState.value.inputAnswer.trim();
  if (!input) return;

  let isCorrect = false;
  let feedbackText = "";

  if (typeof item.validate === 'function') {
    const result = item.validate(input);
    isCorrect = result.isCorrect;
    feedbackText = result.feedback;
  } else {
    isCorrect = input.toLowerCase().includes(item.correct.toLowerCase());
    feedbackText = (isCorrect ? "Tepat! " : "Belum tepat. ") + (item.explanation || "");
  }

  quizState.value.quizFeedbackType = isCorrect ? 'correct' : 'wrong';
  quizState.value.quizFeedback = feedbackText;

  if (isCorrect) {
    if (item.qid) {
      saveProgress(`${item.qid}_Ans`, input);
    }
    quizState.value.choicesDisabled = true;
    revealQuizNext();
  } else {
    registerTypedWrongAttempt(item, input);
  }
};

const submitEssayAnswer = () => {
  const item = currentQuestion.value;
  if (!item || item.type !== 'essay') return;

  const input = quizState.value.essayAnswer.trim();
  const minChars = item.minChars || 150;
  if (input.length < minChars) return;

  quizState.value.choicesDisabled = true;

  let isCorrect = false;
  let feedbackText = "";

  if (typeof item.validate === 'function') {
    const result = item.validate(input);
    isCorrect = result.isCorrect;
    feedbackText = result.feedback;
  } else {
    const lowerInput = input.toLowerCase();
    const keywords = item.keywords || [];
    const foundKeyword = keywords.some(kw => lowerInput.includes(kw));

    isCorrect = keywords.length === 0 || foundKeyword;
    feedbackText = isCorrect 
      ? "Luar biasa! Analisamu sangat mendalam. " + (item.explanation || "")
      : "Hmm, sepertinya ada poin penting yang terlewat. " + (item.explanation || "");
  }

  quizState.value.quizFeedbackType = isCorrect ? 'correct' : 'wrong';
  quizState.value.quizFeedback = feedbackText;

  if (isCorrect) {
    if (item.qid) {
      saveProgress(`${item.qid}_Ans`, input);
    }
    revealQuizNext("Selesai!");
  } else {
    registerTypedWrongAttempt(item, input);
  }
};

const goToNextQuestion = () => {
  if (quizState.value.currentQuestionIdx + 1 >= quizState.value.shuffledQuestions.length) {
    closeQuiz(quizState.value.resumeVideoAfterQuiz, quizState.value.resumeVideoTime);
    return;
  }
  quizState.value.currentQuestionIdx += 1;
  quizState.value.choicesDisabled = false;
  quizState.value.selectedChoice = null;
  quizState.value.quizFeedback = '';
  quizState.value.quizFeedbackType = '';
  quizState.value.essayAnswer = '';
  quizState.value.inputAnswer = '';
  quizState.value.isNextBtnVisible = false;
  
  nextTick(() => {
    renderQuestion();
  });
};

const replayActiveQuizVideo = () => {
  if (!quizState.value.activeQuizConfig || quizState.value.activeQuizStep === null) return;

  const player = players[quizState.value.activeQuizStep];
  if (!player || typeof player.seekTo !== "function") return;

  const replayStart = Math.max(0, quizState.value.activeQuizConfig.time - 30);
  if (currentStep.value !== quizState.value.activeQuizStep) {
    currentStep.value = quizState.value.activeQuizStep;
  }

  quizState.value.activeQuizConfig.shown = false;
  quizState.value.replayingQuizVideo = true;
  quizState.value.replayCheckpointArmed = false;
  
  closeQuiz(false);
  quizReturn.value.isVisible = true;

  nextTick(() => {
    player.seekTo(replayStart, true);
    if (typeof player.playVideo === "function") {
      player.playVideo();
    }
    setTimeout(() => {
      if (!quizState.value.replayingQuizVideo || typeof player.getCurrentTime !== "function") return;
      if (Math.abs(player.getCurrentTime() - replayStart) > 2) {
        player.seekTo(replayStart, true);
      }
    }, 300);
  });
};

const returnToActiveQuiz = () => {
  if (!quizState.value.activeQuizConfig || quizState.value.activeQuizStep === null) return;

  const player = players[quizState.value.activeQuizStep];
  if (player && typeof player.pauseVideo === "function") {
    player.pauseVideo();
  }
  quizState.value.activeQuizConfig.shown = true;
  openQuiz(
    quizState.value.activeQuizConfig.questions,
    quizState.value.activeQuizConfig.resume !== undefined ? quizState.value.activeQuizConfig.resume : true,
    quizState.value.activeQuizConfig.resumeTime,
    quizState.value.activeQuizConfig,
    quizState.value.activeQuizStep
  );
};

// Pyodide Integration
const pyodideBaseUrl = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/";
let pyodideReadyPromise = null;

function ensurePyodideScript() {
  if (typeof window.loadPyodide === "function") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-pyodide-loader]');
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = pyodideBaseUrl + "pyodide.js";
    script.dataset.pyodideLoader = "true";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", () => reject(new Error("Pyodide gagal dimuat.")), { once: true });
    document.head.appendChild(script);
  });
}

function initPyodide() {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = ensurePyodideScript()
      .then(() => window.loadPyodide({ indexURL: pyodideBaseUrl }));
  }
  return pyodideReadyPromise;
}

const runPyodideCode = async (inputId, outputId) => {
  const codeEl = document.getElementById(inputId);
  const outputEl = document.getElementById(outputId);
  if (!codeEl || !outputEl) return;
  outputEl.innerHTML = "Menjalankan...";
  outputEl.style.color = "white";

  try {
    let pyodide = await initPyodide();
    pyodide.setStdout({ batched: (msg) => {
      if (outputEl.innerHTML === "Menjalankan...") outputEl.innerHTML = "";
      outputEl.innerHTML += msg + "\n";
    }});
    
    await pyodide.runPythonAsync(codeEl.value);
    if (outputEl.innerHTML === "Menjalankan...") {
      outputEl.innerHTML = "Program selesai tanpa output teks.";
    }
  } catch (err) {
    outputEl.innerHTML = err;
    outputEl.style.color = "#FF4444";
  }
};

const exposeGlobalMethods = () => {
  const trackAttempt = (qid, answerStr, isCorrect) => {
    if(!qid) return;
    const attKey = qid + "_Att";
    const ansKey = qid + "_Ans";
    let att = (studentProgress.value[attKey] || 0) + 1;
    studentProgress.value[attKey] = att;
    
    if (isCorrect) {
      studentProgress.value[ansKey] = answerStr;
    } else if (att >= 3) {
      markQuestionFailed(qid);
    }
    saveProgress(attKey, att); 
  };

  window.checkGuess = function(btn, isCorrect, explanation) {
    const qid = currentQuestion.value?.qid;
    trackAttempt(qid, btn.innerText, isCorrect);
    
    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    const buttons = container.querySelectorAll('button');
    buttons.forEach(b => {
      b.disabled = true;
      b.style.opacity = '0.5';
    });
    btn.style.opacity = '1';
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>SALAH!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      const attempts = qid ? studentProgress.value[`${qid}_Att`] || 1 : 1;
      if (attempts >= 3) {
        markQuestionFailed(qid);
        feedback.innerHTML += `<br><strong>Sudah 3 kali salah.</strong> Nilai checkpoint ini menjadi 0 dan modul berikutnya tetap terkunci.`;
      } else {
        buttons.forEach(b => {
          b.disabled = false;
          b.style.opacity = '1';
        });
      }
    }
  };

  window.checkMB1QGuess = function(kwVal, condVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let kw = kwVal.replace(/\s+/g, '').toLowerCase();
    let cond = condVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (kw === 'elif' && (cond === 'age<18' || cond === 'age<=17'));
    trackAttempt(qid, `${kwVal} ${condVal}`, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    const isCorrectCondition = isCorrect;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrectCondition) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const kwInput = document.getElementById('mb1-kw');
      const condInput = document.getElementById('mb1-cond');
      if (kwInput) kwInput.disabled = true;
      if (condInput) condInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba lagi! Kata kunci percabangan yang dipakai adalah <code>elif</code> dan kondisinya mengecek apakah usia di bawah 18 tahun (<code>age &lt; 18</code>).`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkMB2QGuess = function(val1, val2, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let v1 = val1.replace(/\s+/g, '');
    let v2 = val2.replace(/\s+/g, '');
    const isCorrect = (v1 === '90' && v2 === '80');
    trackAttempt(qid, `${val1} ${val2}`, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const val1Input = document.getElementById('mb2-val1');
      const val2Input = document.getElementById('mb2-val2');
      if (val1Input) val1Input.disabled = true;
      if (val2Input) val2Input.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>URUTAN MASIH SALAH!</strong><br>Ingat, kondisi paling ketat/sulit (nilai &gt;= 90 untuk A) harus dicek paling atas!`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkParenGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'password_okand(is_adminoris_premium)' || normalizedUser === '(is_adminoris_premium)andpassword_ok' || normalizedUser === 'password_ok==trueand(is_admin==trueoris_premium==true)');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const parenInput = document.getElementById('paren-input');
      if (parenInput) parenInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Pastikan kamu menggabungkan 'is_admin or is_premium' di dalam tanda kurung (), lalu gunakan 'and password_ok'.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkAndGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'andaktif_organisasi==true' || normalizedUser === 'andaktif_organisasi' || normalizedUser === 'and(aktif_organisasi==true)');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const andInput = document.getElementById('and-input');
      if (andInput) andInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba lagi! Kamu butuh operator logika 'and' diikuti dengan kondisi pengecekan variabel aktif_organisasi.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkOrGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'orada_kupon==true' || normalizedUser === 'orada_kupon' || normalizedUser === 'or(ada_kupon==true)');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const orInput = document.getElementById('or-input');
      if (orInput) orInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba lagi! Kamu butuh operator logika 'or' diikuti dengan kondisi pengecekan variabel ada_kupon.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkNestedToLogicalGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'andcuaca=="cerah"' || normalizedUser === 'and(cuaca=="cerah")' || normalizedUser === 'andcuaca==\'cerah\'');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const logicalInput = document.getElementById('logical-input');
      if (logicalInput) logicalInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Pastikan kamu menggunakan operator 'and' lalu cek apakah 'cuaca == "cerah"'.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkNeedsWantsGuess = function(inputClass, btn) {
    const qid = currentQuestion.value?.qid;
    const inputs = document.querySelectorAll('.' + inputClass);
    let allFilled = true;
    let vals = [];
    inputs.forEach(input => {
      if (!input.value.trim()) allFilled = false;
      else vals.push(input.value.trim());
    });
    
    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    
    if (!allFilled) {
      feedback.style.display = 'block';
      setTimeout(() => {
        if (window.innerWidth <= 650) {
          feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      feedback.innerHTML = `❌ Lengkapi kelima contohnya terlebih dahulu ya!`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
      return;
    }
    
    trackAttempt(qid, vals.join(', '), true);

    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    feedback.innerHTML = `✅ <strong>Tersimpan!</strong><br>Terima kasih sudah membagikan pemikiranmu.`;
    feedback.style.backgroundColor = "#27c881";
    feedback.style.color = "var(--black)";
    revealQuizNext();
  };

  window.checkIde6Guess = function(btn) {
    const qid = currentQuestion.value?.qid;
    const codeEl = document.getElementById('python-ide-6');
    const code = codeEl ? codeEl.value.toLowerCase() : '';
    trackAttempt(qid, code, true);
    const keywords = ['buku tulis', 'air minum', 'skin game', 'snack tambahan', 'pulsa', 'gantungan kunci'];
    let matchCount = 0;
    
    keywords.forEach(kw => {
      if (code.includes(kw)) matchCount++;
    });

    const container = btn.parentElement;
    const feedback = container.nextElementSibling.nextElementSibling;
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (matchCount >= 3) {
      feedback.innerHTML = `✅ <strong>Bagus!</strong> Kamu sudah memakai setidaknya 3 barang dari tabel.`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ Kamu baru memasukkan ${matchCount} barang dari tabel di kodemu. Minimal butuh 3 barang (misal: "Buku tulis", "Skin game", dsb).`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkTab6Guess = function(btn) {
    const qid = currentQuestion.value?.qid;
    const inputEl = document.getElementById('tab6-inline-input');
    if (!inputEl) return;
    
    let userVal = inputEl.value.trim();
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'returnprice*quantity' || normalizedUser === 'returnquantity*price');
    
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    
    feedback.style.display = 'block';
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>Nama variabel sebelumnya salah, dan harus menggunakan operator perkalian (*) agar mendapatkan 30000.`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      inputEl.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba lagi! Pastikan nama variabel sesuai dengan parameter (<code>price</code> dan <code>quantity</code>), lalu gunakan operator yang tepat (ditambah atau dikali?).`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkTab8Guess = function(btn) {
    const qid = currentQuestion.value?.qid;
    const input1 = document.getElementById('tab8-input-1');
    const input2 = document.getElementById('tab8-input-2');
    if (!input1 || !input2) return;
    
    let userVal1 = input1.value;
    let userVal2 = input2.value;
    let val1 = userVal1.replace(/\s+/g, '').toLowerCase();
    let val2 = userVal2.trim().toLowerCase();
    
    const isVal1Correct = val1.includes('principal') && val1.includes('rate') && val1.includes('years') && val1.includes('*');
    const isVal2Correct = val2 === 'return';
    const isCorrect = isVal1Correct && isVal2Correct;
    
    trackAttempt(qid, userVal1 + ' | ' + userVal2, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    
    feedback.style.display = 'block';
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>Kamu berhasil mengingat rumusnya: <code>interest = principal * rate * years</code> dan mengembalikan nilainya dengan <code>return</code>.`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      input1.disabled = true;
      input2.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba cek lagi! Di baris pertama pastikan ada perkalian <code>principal</code>, <code>rate</code>, dan <code>years</code>. Di baris kedua gunakan keyword untuk mengembalikan nilai fungsi.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkTab8Quiz2Guess = function(btn) {
    const qid = currentQuestion.value?.qid;
    const inputEl = document.getElementById('tab8-quiz2-input');
    if (!inputEl) return;
    
    let userVal = inputEl.value.trim();
    let normalizedUser = userVal.replace(/\s+/g, '').replace(/,/g, '');
    
    const isCorrect = (normalizedUser === '210000' || normalizedUser === '210000.0' || normalizedUser === '210.000');
    
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    
    feedback.style.display = 'block';
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>Hasilnya adalah <strong>210000</strong>. Pertama, bunga dihitung: 200000 * 0.05 = 10000. Lalu uang ditambahkan dengan bunga: 200000 + 10000 = 210000.`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      inputEl.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>JAWABAN BELUM TEPAT!</strong><br>Coba hitung perlahan. Berapa 5% dari 200.000? Lalu tambahkan hasil itu ke 200.000.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.runPyodideCode = runPyodideCode;
  let finalProjectAttempts = 0;
  window.runAssignmentCode = function() {
    finalProjectAttempts++;
    studentProgress.value['Final_Project_Attempts'] = finalProjectAttempts;
    saveProgress('Final_Project_Attempts', finalProjectAttempts);
    runPyodideCode('python-ide-4', 'ide-output-4');
  };
  let project7Attempts = 0;
  window.runAssignmentCode7 = function() {
    project7Attempts++;
    studentProgress.value['Project7_Attempts'] = project7Attempts;
    saveProgress('Project7_Attempts', project7Attempts);
    runPyodideCode('python-ide-7', 'ide-output-7');
  };
  window.submitAssignmentCode7 = function() {
    const codeEl = document.getElementById('python-ide-7');
    const code = codeEl ? codeEl.value : '';
    let score = 'Submit';
    if (code.includes('def ') && (code.includes('+') || code.includes('*'))) score = 'Bagus';
    
    studentProgress.value['Project7_Code'] = code;
    studentProgress.value['Project7_Score'] = score;
    saveProgress('Project7_Code', code);
    saveProgress('Project7_Score', score);

    showDashboardNotice({
      type: 'success',
      title: 'Tugas tersimpan',
      message: 'Progress Mini Project 7 kamu otomatis tersimpan di server.'
    });
  };
  window.submitAssignmentCode = function() {
    const codeEl = document.getElementById('python-ide-4');
    const code = codeEl ? codeEl.value : '';
    let score = 'Submit';
    if (code.includes('for ') && code.includes('if ') && code.includes('break')) score = 'Bagus';

    
    studentProgress.value['Final_Project_Code'] = code;
    studentProgress.value['Final_Project_Score'] = score;
    saveProgress('Final_Project_Code', code);
    saveProgress('Final_Project_Score', score);

    showDashboardNotice({
      type: 'success',
      title: 'Tugas tersimpan',
      message: 'Progress kamu otomatis tersimpan di server. Selamat, kamu telah menyelesaikan Misi Conditional.'
    });
  };
};

onMounted(() => {
  quizObj.onValuesChange((values) => {
    quizModalStyles.value = {
      transform: `translateY(${values.y}px) scale(${values.scale})`,
      opacity: values.opacity
    };
  });

  if (window.YT && typeof window.YT.Player === "function") {
    youtubeReady.value = true;
    initializeYouTubePlayer(currentStep.value);
  } else {
    const oldReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (oldReady) oldReady();
      youtubeReady.value = true;
      initializeYouTubePlayer(currentStep.value);
    };
  }
  exposeGlobalMethods();
});

watch(currentStep, (newStep) => {
  Object.keys(players).forEach(id => {
    if (Number(id) !== newStep && players[id] && typeof players[id].pauseVideo === 'function') {
      players[id].pauseVideo();
    }
  });

  if (quizState.value.activeQuizStep !== null && quizState.value.activeQuizStep !== newStep) {
    quizState.value.replayingQuizVideo = false;
    quizState.value.replayCheckpointArmed = false;
    quizReturn.value.isVisible = false;
  }

  nextTick(() => {
    initializeYouTubePlayer(newStep);
  });
});

const openQuizButtonHandler = () => {
  if (players[currentStep.value] && typeof players[currentStep.value].pauseVideo === "function") {
    players[currentStep.value].pauseVideo();
  }
  openQuiz(courseData[2].quizzes[0].questions, false);
};

const isStepFinished = (stepId) => {
  if (courseData[stepId]?.videoId) {
    if (!videoWatchedStatus.value[stepId]) return false;
  }

  const stepQuizzes = courseData[stepId]?.quizzes;
  if (stepQuizzes && stepQuizzes.length > 0) {
    for (let quiz of stepQuizzes) {
      for (let q of quiz.questions) {
        if (!q.qid) continue;
        const ans = studentProgress.value[`${q.qid}_Ans`];
        if (
          ans === undefined ||
          ans === null ||
          ans === '' ||
          ans === '-' ||
          ans === '0' ||
          studentProgress.value[`${q.qid}_Failed`] === true
        ) return false;
      }
    }
  }

  return true;
};

const goToStep = (step) => {
  if (step <= currentStep.value) {
    currentStep.value = step;
    return;
  }
  for (let i = 1; i < step; i++) {
    if (!isStepFinished(i)) {
      alert(`Mohon selesaikan video dan kuis/tugas di Modul ${i} terlebih dahulu.`);
      return;
    }
  }
  currentStep.value = step;
};

const handleStepSelect = (event) => {
  const requestedStep = Number(event.target.value);
  goToStep(requestedStep);
  event.target.value = String(currentStep.value);
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const nextStep = () => {
  if (!isStepFinished(currentStep.value)) {
    alert(`Mohon selesaikan video dan kuis/tugas di modul ini terlebih dahulu.`);
    return;
  }
  if (currentStep.value < Object.keys(courseData).length) {
    currentStep.value++;
  }
};

const getStepConfig = (stepId) => {
  return courseData[stepId];
};
const cdnCovers = [
  "https://cdn-web-2.ruangguru.com/landing-pages/assets/fec32e8d-d711-48a2-bd22-59581f0594c1.jpg",
  "https://cdn-web-2.ruangguru.com/landing-pages/assets/2925ebc7-89c3-4010-a057-9807aacc6a32.jpg",
  "https://cdn-web-2.ruangguru.com/landing-pages/assets/ec2aeaa6-e2e2-4e83-861e-223bfb9e1138.jpg",
  "https://cdn-web-2.ruangguru.com/landing-pages/assets/47f3ef56-348b-4c3c-a767-aa4a40c5b833.jpg",
  "https://cdn-web-2.ruangguru.com/landing-pages/assets/00c64b24-9e45-4a7e-8665-0817c04217c3.jpg",
  "https://cdn-web-2.ruangguru.com/landing-pages/assets/c179c0a4-8817-4f1b-a9ef-cf6dcaa093c9.jpg",
  "https://cdn-web-2.ruangguru.com/landing-pages/assets/98bcac2b-e88e-46d8-b1c1-deebd6a12c03.jpg"
];

const getCover = (key) => {
  const index = (Number(key) - 1) % cdnCovers.length;
  return cdnCovers[index];
};
</script>

<template>
  <img class="planet planet-one" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/e49806a2-dcc4-4858-a261-c4e33b798180.png" alt="">
  <img class="planet planet-two" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/eaa66ac5-e69c-46f2-b942-909bcaad579a.png" alt="">

  <transition name="fade">
    <div v-if="!isLoggedIn" class="login-overlay">
      <div class="login-card">
        <div class="login-copy">
          <div class="brand-group-login">
            <img class="rg-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Ruangguru_logo.svg/3840px-Ruangguru_logo.svg.png" alt="Ruangguru">
            <img class="uob-logo" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/37185db7-24a8-467d-aabb-1d5df48f9bc0.png" alt="UOB">
          </div>
          <span class="login-kicker">UOB My Digital Space</span>
          <h1>Python Learning Dashboard</h1>
          <p>Masuk dengan email siswa untuk membuka materi kelasmu.</p>
          <div class="login-highlights" aria-label="Fitur pembelajaran">
            <span>High School</span>
            <span>Python</span>
            <span>Async Class</span>
          </div>
        </div>

        <div class="login-form-panel">
          <span class="login-step">Materi Grup B - HS - 2B</span>
          <h2>Masuk ke kelas</h2>
          <div class="input-group">
            <label for="login-school-b">Nama sekolah</label>
            <div class="login-combobox">
              <input id="login-school-b" type="text" v-model="loginSchool" placeholder="Cari nama sekolah" autocomplete="off" @focus="openSchoolDropdown" @blur="closeSchoolDropdownSoon" @input="handleSchoolInput" :disabled="isLoggingIn">
              <div v-if="isSchoolDropdownOpen" class="login-dropdown">
                <template v-if="!isSchoolLoading">
                  <button v-for="school in schoolOptions" :key="school" type="button" @mousedown.prevent="selectSchool(school)">
                    {{ school }}
                  </button>
                </template>
                <p v-if="isSchoolLoading">Memuat data sekolah...</p>
                <p v-else-if="!schoolOptions.length">Sekolah tidak ditemukan.</p>
              </div>
            </div>

            <label for="login-email-b">Email terdaftar di Akademia Ruangguru</label>
            <input id="login-email-b" type="email" v-model="loginEmail" placeholder="nama@email.com" @input="handleEmailInput" @keyup.enter="handleLogin" :disabled="isLoggingIn || !selectedSchool">

            <button type="button" class="login-help-toggle" @click="toggleEmailHelp" :disabled="!selectedSchool">
              Tidak yakin emailnya? Cari bantuan lewat nama/email
            </button>

            <div v-if="emailHelpOpen" class="email-help-panel">
              <label for="login-help-b">Cari nama siswa/orang tua atau email</label>
              <input id="login-help-b" type="text" v-model="emailHelpQuery" placeholder="Contoh: Taylor atau gmail" @input="handleEmailHelpInput">
              <div class="email-help-results">
                <p v-if="!emailHelpQuery.trim()">Ketik nama atau sebagian email yang mungkin terdaftar.</p>
                <p v-else-if="isEmailHelpLoading">Mencari data...</p>
                <p v-else-if="!emailHelpResults.length">Belum ada data yang mirip di sekolah ini.</p>
                <div v-for="student in emailHelpResults" :key="`${student.school}-${student.name}-${student.maskedEmail}`" class="email-help-result">
                  <strong>{{ student.name }}</strong>
                  <span class="email-help-label">Email terdaftar:</span>
                  <code v-if="student.maskedEmail">{{ student.maskedEmail }}</code>
                  <span v-else class="email-help-missing">Email belum tersedia. Coba cek lagi email yang didaftarkan di Akademia Ruangguru.</span>
                </div>
                <p v-if="emailHelpResults.length" class="email-help-note">Gunakan email terdaftar di atas untuk masuk ke kelas.</p>
              </div>
            </div>

            <button @click="handleLogin" :disabled="isLoggingIn || !selectedSchool || !loginEmail.trim()" class="login-btn">
              {{ isLoggingIn ? 'Memuat...' : 'Mulai Belajar' }}
            </button>
          </div>
          <p class="login-helper">Gunakan email pribadi yang sudah didaftarkan di Akademia Ruangguru.</p>

          <transition name="pop">
            <div v-if="showLoginError" class="login-error-msg">
              <span class="icon">!</span>
              <div>
                <strong>{{ loginErrorTitle }}</strong>
                <p>{{ loginErrorMessage }}</p>
                <div v-if="loginEmailSuggestion" class="registered-email-card">
                  <span>Email terdaftar di sekolah ini:</span>
                  <strong>{{ loginEmailSuggestion.maskedEmail || 'Email belum tersedia' }}</strong>
                  <p>Coba cek lagi tanda titik, huruf yang tertukar, atau domain emailnya.</p>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </transition>

  <div class="site-shell" v-show="isLoggedIn">
    <header class="topbar">
      <div class="brand-group">
        <img class="rg-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Ruangguru_logo.svg/3840px-Ruangguru_logo.svg.png" alt="Ruangguru">
        <img class="uob-logo" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/37185db7-24a8-467d-aabb-1d5df48f9bc0.png" alt="UOB">
      </div>
      <div class="student-chip" aria-label="Profil siswa" @click="showProfileMenu = !showProfileMenu">
        <div class="avatar" aria-hidden="true"></div>
        <div class="student-info">
          <strong>
            {{ studentData.name || 'Siswa Kalananti' }}
            <span class="dropdown-icon">▼</span>
          </strong>
          <span v-if="studentData.school">{{ studentData.school }}</span>
          <span v-else>Siap lanjut belajar</span>
        </div>
        
        <transition name="fade">
          <div v-if="showProfileMenu" class="profile-dropdown">
            <button @click.stop="handleLogout" class="dropdown-item">⏏ Keluar</button>
          </div>
        </transition>
      </div>
    </header>

    <main class="dashboard">
      <aside class="sidebar">
        <div class="eyebrow">Asynchronous Learning</div>
        <h1>Misi: Optimasi Algoritma & Function</h1>
        <p class="sidebar-intro">
          Pelajari cara membuat kodemu berjalan lebih cepat dan terstruktur rapi dengan <strong>function</strong>.
        </p>

        <div class="mission-progress" aria-label="Progres pembelajaran">
          <div class="progress-copy">
            <span>Progres misi</span>
            <span id="progressText">{{ currentStep }} dari {{ totalSteps }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: (currentStep / totalSteps * 100) + '%' }"></div>
          </div>
        </div>

        <nav class="mobile-nav">
          <label for="mobile-lesson-select">Pilih Modul</label>
          <div class="select-wrapper">
            <select id="mobile-lesson-select" :value="currentStep" @change="handleStepSelect">
              <option :value="1">01 Optimasi & Function</option>
              <option :value="2">02 Optimasi Loop & Step Count</option>
              <option :value="3">03 Optimasi Program Python</option>
              <option :value="4">04 Mini Project</option>
              <option :value="5">05 Functions in Python</option>
              <option :value="6">06 Modular Design in Python</option>
              <option :value="7">07 Mini Project</option>
              <option :value="8">08 Financial Literacy</option>
            </select>
          </div>
        </nav>

        <nav class="lesson-nav" aria-label="Daftar video">
          <button class="lesson-tab" :class="{ active: currentStep === 1 }" type="button" @click="goToStep(1)">
            <span class="tab-number">01</span>
            <span class="tab-copy">
              <strong>Optimasi & Function</strong>
              <span>Konsep dasar</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 2 }" type="button" @click="goToStep(2)">
            <span class="tab-number">02</span>
            <span class="tab-copy">
              <strong>Loop & Step Count</strong>
              <span>Menghitung langkah</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 3 }" type="button" @click="goToStep(3)">
            <span class="tab-number">03</span>
            <span class="tab-copy">
              <strong>Optimasi Program Python</strong>
              <span>Mini project</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 4 }" type="button" @click="goToStep(4)">
            <span class="tab-number">04</span>
            <span class="tab-copy">
              <strong>Mini Project</strong>
              <span>Tugas akhir</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 5 }" type="button" @click="goToStep(5)">
            <span class="tab-number">05</span>
            <span class="tab-copy">
              <strong>Functions in Python</strong>
              <span>Def & Return</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 6 }" type="button" @click="goToStep(6)">
            <span class="tab-number">06</span>
            <span class="tab-copy">
              <strong>Modular Design</strong>
              <span>Python Modular</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 7 }" type="button" @click="goToStep(7)">
            <span class="tab-number">07</span>
            <span class="tab-copy">
              <strong>Mini Project</strong>
              <span>Tugas Akhir</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 8 }" type="button" @click="goToStep(8)">
            <span class="tab-number">08</span>
            <span class="tab-copy">
              <strong>Financial Literacy</strong>
              <span>Menabung, Bunga Tunggal, Bunga Majemuk</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
        </nav>


        <div class="help-card">
          Ada bagian yang masih membingungkan?
          <a href="mailto:fasilitator@kalananti.id">Tanya fasilitator</a>
        </div>
      </aside>

      <section class="content">
        <div class="content-top">
          <div>
            <p class="lesson-kicker">{{ courseData[currentStep].kicker }}</p>
            <h2 class="lesson-title">{{ courseData[currentStep].title }}</h2>
          </div>
          <span class="duration-pill">{{ courseData[currentStep].duration }}</span>
        </div>

        <section class="step-panel" id="step-1" v-show="currentStep === 1">
          <div class="video-frame" :class="{ 'player-ready': playerStates[1]?.isReady }" data-video-step="1">
            <video 
              v-show="playerStates[1]?.introPlaying"
              :ref="(el) => { if (el) introRefs[1] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(1)"
              @play="onIntroPlay(1)"
              @pause="onIntroPause(1)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-1"></div>
            <div class="custom-thumbnail" v-show="!playerStates[1]?.hasStarted" @click="togglePlay(1)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(1).kicker">{{ getStepConfig(1).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(1).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[1]?.isPlaying && !playerStates[1]?.isBuffering && (playerStates[1]?.isReady || !playerStates[1]?.hasStarted)" @click="togglePlay(1)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[1]?.isBuffering || (playerStates[1]?.hasStarted && !playerStates[1]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 1">
              <button class="video-control-button video-play" type="button" @click="togglePlay(1)">{{ playerStates[1]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[1]?.progress || 0" @input="onSeekInput(1, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[1]?.currentTimeFormatted || "0:00" }} / {{ playerStates[1]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(1)">{{ playerStates[1]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(1)">⛶</button>
            </div>
          </div>

          <div class="bookmarks-container" v-if="courseData[1].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[1].bookmarks" :key="bm.label" @click="seekToBookmark(1, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <article class="summary-card">
              <h3 class="card-heading">
                <span class="heading-icon" aria-hidden="true">01</span>
                Loot Box Hari Ini 🎁
              </h3>
              <ul class="takeaway-list">
                <li><strong>Apa Itu Algoritma:</strong> Langkah-langkah atau resep untuk menyelesaikan suatu masalah.</li>
                <li><strong>Banyak Jalan:</strong> Satu masalah yang sama bisa diselesaikan dengan algoritma atau cara yang berbeda-beda.</li>
                <li><strong>Optimasi Algoritma:</strong> Usaha untuk membuat langkah penyelesaian menjadi lebih efisien tanpa melakukan hal yang tidak perlu.</li>
              </ul>
            </article>

              <aside class="focus-card">
              <div>
                <p class="label">Cheat Sheet 📝</p>
                <h3>Prinsip Optimasi</h3>
                <p>Ingat konsep utama ini saat kamu merancang sebuah program:</p>
              </div>
              <div class="mini-code">
                <span class="code-comment"># Tipe 1: Cara Lambat (Brute Force)</span><br>
                <span class="code-comment"># Mencari tanpa arah. Mengecek semua data dari awal</span><br>
                <span class="code-comment"># sampai akhir. Memakan banyak waktu!</span><br><br>
                <span class="code-comment"># Tipe 2: Cara Cepat (Optimasi)</span><br>
                <span class="code-comment"># Punya pola/petunjuk. Mengurangi pencarian yang</span><br>
                <span class="code-comment"># tidak penting. Jauh lebih efisien!</span>
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Materi Bacaan 01</p>
                <h3>Optimasi Algoritma Dasar</h3>
                <p>Mengenal apa itu algoritma dan mengapa efisiensi langkah sangat penting.</p>
              </div>
              <span class="reading-badge">Konsep Utama</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">A</span>
                <h4>Algoritma</h4>
                <p>Langkah-langkah untuk menyelesaikan masalah, seperti resep memasak mie instan.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">B</span>
                <h4>Berbeda-beda</h4>
                <p>Masalah yang sama dapat dipecahkan melalui banyak cara yang berbeda.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">C</span>
                <h4>Optimasi</h4>
                <p>Membuat program menyelesaikan tugas yang sama, namun dengan cara yang lebih pintar!</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Analogi Optimasi: Mencari Buku 📚</h4>
              <p>Tujuannya sama: Menemukan buku matematika, tapi cara pendekatannya berbeda.</p>
              <ul>
                <li><strong>Cara Lambat (Step Count Banyak):</strong> Cek setiap buku satu per satu dari kiri ke kanan tanpa arah yang jelas.</li>
                <li><strong>Cara Cepat:</strong> Langsung cari di bagian buku pelajaran, lalu cari label "Matematika".</li>
              </ul>
              <p class="reading-note"><strong>Intinya:</strong> Masalah yang sama bisa diselesaikan dengan algoritma berbeda. Pilihlah cara yang paling cerdik agar kamu tidak membuang waktu dan tenaga!</p>
            </article>
          </div>
          </details>
        </section>
        <section class="step-panel" id="step-2" v-show="currentStep === 2">
          <div class="video-frame" :class="{ 'player-ready': playerStates[2]?.isReady }" data-video-step="2">
            <video 
              v-show="playerStates[2]?.introPlaying"
              :ref="(el) => { if (el) introRefs[2] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(2)"
              @play="onIntroPlay(2)"
              @pause="onIntroPause(2)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-2"></div>
            <div class="custom-thumbnail" v-show="!playerStates[2]?.hasStarted" @click="togglePlay(2)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(2).kicker">{{ getStepConfig(2).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(2).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[2]?.isPlaying && !playerStates[2]?.isBuffering && (playerStates[2]?.isReady || !playerStates[2]?.hasStarted)" @click="togglePlay(2)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[2]?.isBuffering || (playerStates[2]?.hasStarted && !playerStates[2]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 2">
              <button class="video-control-button video-play" type="button" @click="togglePlay(2)">{{ playerStates[2]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[2]?.progress || 0" @input="onSeekInput(2, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[2]?.currentTimeFormatted || "0:00" }} / {{ playerStates[2]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(2)">{{ playerStates[2]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(2)">⛶</button>
            </div>
          </div>

          <div class="bookmarks-container" v-if="courseData[2].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[2].bookmarks" :key="bm.label" @click="seekToBookmark(2, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <article class="summary-card">
              <h3 class="card-heading">
                <span class="heading-icon" aria-hidden="true">02</span>
                Loot Box Hari Ini 🎁
              </h3>
              <ul class="takeaway-list">
                <li><strong>Looping:</strong> Cara kita memerintahkan komputer melakukan hal yang sama berulang kali.</li>
                <li><strong>Step Count di Loop:</strong> Setiap kali loop berjalan, program melakukan 1 langkah. Jika loop 10 kali, ada 10 step count!</li>
                <li><strong>Optimasi dengan Break:</strong> Hentikan loop segera setelah tujuan tercapai agar step count tidak mubazir.</li>
              </ul>
            </article>

              <aside class="focus-card">
              <div>
                <p class="label">Cheat Sheet 📝</p>
                <h3>Menggunakan Break</h3>
                <p>Bagaimana menghentikan loop di tengah jalan?</p>
              </div>
              <div class="mini-code">
                <span class="keyword">for</span> angka <span class="keyword">in</span> daftar:<br>
                &nbsp;&nbsp;<span class="keyword">if</span> angka == target:<br>
                &nbsp;&nbsp;&nbsp;&nbsp;<span class="keyword">break</span> <span class="code-comment"># Langsung berhenti!</span>
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Materi Bacaan 02</p>
                <h3>Optimasi Loop</h3>
                <p>Membatasi langkah berulang agar program super cepat.</p>
              </div>
              <span class="reading-badge">Konsep Utama</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">A</span>
                <h4>Loop</h4>
                <p>Perulangan. Berguna jika kita ingin mengecek data satu per satu dari awal sampai akhir.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">B</span>
                <h4>Condition</h4>
                <p>Syarat atau cek poin di dalam loop. "Apakah nilai ini yang saya cari?"</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">C</span>
                <h4>Break</h4>
                <p>Tombol rem darurat! Digunakan untuk menghentikan loop seketika saat kondisi sudah terpenuhi.</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Kenapa Butuh Break? 🛑</h4>
              <p>Misalnya kamu mencari angka 5 dari list: <code>[1, 5, 10, 20, 50, 100]</code>.</p>
              <ul>
                <li><strong>Tanpa Break:</strong> Program tetap akan mengecek angka 10, 20, 50, 100 walaupun 5 sudah ketemu (6 step).</li>
                <li><strong>Dengan Break:</strong> Program berhenti langsung di langkah ke-2 karena 5 sudah ketemu (2 step).</li>
              </ul>
              <p class="reading-note"><strong>Intinya:</strong> Gunakan `break` untuk menghindari pekerjaan sia-sia. Step count berkurang, program berjalan lebih instan.</p>
            </article>
          </div>
          </details>
        </section>

        <section class="step-panel" id="step-3" v-show="currentStep === 3">
          <div class="video-frame" :class="{ 'player-ready': playerStates[3]?.isReady }" data-video-step="3">
            <video 
              v-show="playerStates[3]?.introPlaying"
              :ref="(el) => { if (el) introRefs[3] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(3)"
              @play="onIntroPlay(3)"
              @pause="onIntroPause(3)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-3"></div>
            <div class="custom-thumbnail" v-show="!playerStates[3]?.hasStarted" @click="togglePlay(3)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(3).kicker">{{ getStepConfig(3).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(3).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[3]?.isPlaying && !playerStates[3]?.isBuffering && (playerStates[3]?.isReady || !playerStates[3]?.hasStarted)" @click="togglePlay(3)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[3]?.isBuffering || (playerStates[3]?.hasStarted && !playerStates[3]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 3">
              <button class="video-control-button video-play" type="button" @click="togglePlay(3)">{{ playerStates[3]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[3]?.progress || 0" @input="onSeekInput(3, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[3]?.currentTimeFormatted || "0:00" }} / {{ playerStates[3]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(3)">{{ playerStates[3]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(3)">⛶</button>
            </div>
          </div>

          <div class="bookmarks-container" v-if="courseData[3]?.bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[3].bookmarks" :key="bm.label" @click="seekToBookmark(3, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <article class="summary-card">
              <h3 class="card-heading">
                <span class="heading-icon" aria-hidden="true">03</span>
                Loot Box Hari Ini 🎁
              </h3>
              <ul class="takeaway-list">
                <li><strong>Gunakan Struktur Data Tepat:</strong> Menyimpan data dalam list membuat operasi berulang jauh lebih praktis.</li>
                <li><strong>Fungsi Bawaan (Built-in):</strong> Memanfaatkan fungsi seperti <code>sum()</code> bisa menggantikan looping manual dan mengurangi panjang baris kode.</li>
              </ul>
            </article>

            <aside class="focus-card">
              <div>
                <p class="label">Cheat Sheet 📝</p>
                <h3>List & Looping</h3>
                <p>Bagaimana list dan fungsi bawaan membantu:</p>
              </div>
              <div class="mini-code">
                <span class="code-comment"># Tanpa List (Hardcode)</span><br>
                total = a + b + c + d<br><br>
                <span class="code-comment"># Dengan List & sum()</span><br>
                data = [a, b, c, d]<br>
                total = sum(data)
              </div>
            </aside>
          </div>
        </section>

        <section class="step-panel" id="step-4" v-show="currentStep === 4">
          <div class="video-frame" :class="{ 'player-ready': playerStates[4]?.isReady }" data-video-step="4">
            <video 
              v-show="playerStates[4]?.introPlaying"
              :ref="(el) => { if (el) introRefs[4] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(4)"
              @play="onIntroPlay(4)"
              @pause="onIntroPause(4)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-4"></div>
            <div class="custom-thumbnail" v-show="!playerStates[4]?.hasStarted" @click="togglePlay(4)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(4).kicker">{{ getStepConfig(4).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(4).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[4]?.isPlaying && !playerStates[4]?.isBuffering && (playerStates[4]?.isReady || !playerStates[4]?.hasStarted)" @click="togglePlay(4)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[4]?.isBuffering || (playerStates[4]?.hasStarted && !playerStates[4]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 4">
              <button class="video-control-button video-play" type="button" @click="togglePlay(4)">{{ playerStates[4]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[4]?.progress || 0" @input="onSeekInput(4, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[4]?.currentTimeFormatted || "0:00" }} / {{ playerStates[4]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(4)">{{ playerStates[4]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(4)">⛶</button>
            </div>
          </div>
          <div class="bookmarks-container" v-if="courseData[4]?.bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[4].bookmarks" :key="bm.label" @click="seekToBookmark(4, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
            <summary>Buka Assignment Optimasi</summary>
            <div class="lesson-reading">
              <div style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; border: 3px solid #ffe600; box-shadow: 4px 4px 0px #ffe600; color: #f8f8f2; margin-bottom: 24px; margin-top: 15px;">
                <h3 style="color: #ffe600; font-family: 'Outfit', sans-serif; margin-top: 0;">Mini Project Optimasi 🏆</h3>
                <p style="font-size: 16px; font-family: 'Outfit', sans-serif; margin-bottom: 15px;">Buat program yang mencari nama dalam daftar siswa.</p>
                <div style="display: inline-block; background-color: #00c3ff; padding: 6px 16px; border-radius: 8px; border: 2px solid #1a1a1a; color: #1a1a1a; font-weight: bold; margin-bottom: 15px;">Syarat:</div>
                <ul style="font-size: 16px; font-family: 'Outfit', sans-serif; padding-left: 20px;">
                  <li>Menyimpan daftar nama.</li>
                  <li>Mencari satu nama target.</li>
                  <li>Menghitung jumlah langkah pencarian.</li>
                  <li>Berhenti jika nama sudah ditemukan.</li>
                  <li>Menampilkan apakah nama ditemukan atau tidak.</li>
                </ul>
              </div>

              <!-- Python IDE -->
              <div class="ide-container" style="background-color: #282c34; border-radius: 12px; padding: 20px; color: white; border: 4px solid var(--black); margin-bottom: 40px; box-shadow: 6px 6px 0px var(--black);">
                <h3 style="margin-top: 0; color: var(--yellow); font-family: 'Outfit', sans-serif;">Tulis dan uji programmu</h3>
                <textarea id="python-ide-4" spellcheck="false" style="width: 100%; height: 300px; background-color: #1e1e1e; color: #d4d4d4; font-family: 'Courier New', Courier, monospace; font-size: 16px; padding: 15px; border-radius: 8px; border: 1px solid #444; margin-bottom: 15px; resize: vertical;">students = ["Alya", "Bima", "Caca", "Dion", "Eka"]
target = "Dion"

steps = 0
found = False

# Lanjutkan programmu di bawah ini:
</textarea>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                  <button onclick="runAssignmentCode()" style="background-color: #4ade80; color: var(--black); font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid var(--black); cursor: pointer; font-family: 'Outfit', sans-serif; box-shadow: 3px 3px 0px var(--black);">▶ Jalankan Kode</button>
                  <button onclick="submitAssignmentCode()" style="background-color: #00c3ff; color: var(--white); font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid var(--black); cursor: pointer; font-family: 'Outfit', sans-serif; box-shadow: 3px 3px 0px var(--black);">📥 Submit Tugas</button>
                </div>
                <h4 style="margin-bottom: 5px; font-family: 'Outfit', sans-serif;">Console Output:</h4>
                <div id="ide-output-4" style="background-color: black; padding: 15px; border-radius: 8px; min-height: 100px; font-family: 'Courier New', Courier, monospace; white-space: pre-wrap; font-size: 14px; border: 1px solid #444;"></div>
              </div>
            </div>
          </details>
        </section>

        <section class="step-panel" id="step-5" v-show="currentStep === 5">
          <div class="video-frame" :class="{ 'player-ready': playerStates[5]?.isReady }" data-video-step="5">
            <video 
              v-show="playerStates[5]?.introPlaying"
              :ref="(el) => { if (el) introRefs[5] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(5)"
              @play="onIntroPlay(5)"
              @pause="onIntroPause(5)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-5"></div>
            <div class="custom-thumbnail" v-show="!playerStates[5]?.hasStarted" @click="togglePlay(5)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(5).kicker">{{ getStepConfig(5).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(5).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[5]?.isPlaying && !playerStates[5]?.isBuffering && (playerStates[5]?.isReady || !playerStates[5]?.hasStarted)" @click="togglePlay(5)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[5]?.isBuffering || (playerStates[5]?.hasStarted && !playerStates[5]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 5">
              <button class="video-control-button video-play" type="button" @click="togglePlay(5)">{{ playerStates[5]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[5]?.progress || 0" @input="onSeekInput(5, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[5]?.currentTimeFormatted || "0:00" }} / {{ playerStates[5]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(5)">{{ playerStates[5]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(5)">⛶</button>
            </div>
          </div>
          <div class="bookmarks-container" v-if="courseData[5]?.bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[5].bookmarks" :key="bm.label" @click="seekToBookmark(5, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>

          <div class="below-video">
            <article class="summary-card">
              <h3 class="card-heading">
                <span class="heading-icon" aria-hidden="true">05</span>
                Loot Box Hari Ini 🎁
              </h3>
              <ul class="takeaway-list">
                <li><strong>Function:</strong> Kumpulan perintah bernama. Seperti tombol otomatis, sekali ditekan semua perintah di dalamnya berjalan.</li>
                <li><strong>Parameter:</strong> Input atau bahan yang kita berikan ke dalam function (seperti buah pada mesin jus).</li>
                <li><strong>Return:</strong> Hasil output atau kembalian dari function (seperti jus yang keluar dari mesin).</li>
              </ul>
            </article>

            <aside class="focus-card">
              <div>
                <p class="label">Cheat Sheet 📝</p>
                <h3>Membuat & Memanggil Function</h3>
                <p>Gunakan keyword <code>def</code> untuk membuat function di Python.</p>
              </div>
              <div class="mini-code">
                <span class="code-comment"># Membuat function</span><br>
                <span class="keyword">def</span> <span class="function">sapa</span>(<span class="string">nama</span>):<br>
                &nbsp;&nbsp;<span class="function">return</span> <span class="string">"Halo, "</span> + nama<br><br>
                <span class="code-comment"># Memanggil function</span><br>
                hasil = <span class="function">sapa</span>(<span class="string">"Andi"</span>)
              </div>
            </aside>
          </div>
          
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
            <summary>Buka Materi Bacaan</summary>
            <div class="lesson-reading">
              <header class="reading-header">
                <div>
                  <p class="label">Materi Bacaan 03</p>
                  <h3>Function secara General</h3>
                  <p>Mendefinisikan dan memanggil function di Python.</p>
                </div>
                <span class="reading-badge">Konsep Utama</span>
              </header>

              <div class="concept-grid">
                <article class="concept-card">
                  <span class="concept-number">A</span>
                  <h4>Apa itu Function?</h4>
                  <p>Function adalah kumpulan perintah yang diberi nama untuk menghindari penulisan kode berulang-ulang.</p>
                </article>
                <article class="concept-card">
                  <span class="concept-number">B</span>
                  <h4>Analogi Mesin Jus</h4>
                  <p>Function menerima buah (input parameter), memprosesnya, dan mengeluarkan jus (output return).</p>
                </article>
                <article class="concept-card">
                  <span class="concept-number">C</span>
                  <h4>Pemanggilan Function</h4>
                  <p>Function yang sudah dibuat tidak akan berjalan sebelum kita memanggil namanya.</p>
                </article>
              </div>

              <article class="reading-section">
                <h4>Cara Membuat Function di Python</h4>
                <p>Gunakan keyword <code>def</code> diikuti nama function dan tanda kurung. Jangan lupa indentasi!</p>
                <div class="code-block">
                  <span class="keyword">def</span> <span class="function">greet</span>():<br>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>(<span class="string">"Halo!"</span>)
                </div>
              </article>
            </div>
          </details>
        </section>

        <section class="step-panel" id="step-6" v-show="currentStep === 6">
          <div class="video-frame" :class="{ 'player-ready': playerStates[6]?.isReady }" data-video-step="6">
            <video 
              v-show="playerStates[6]?.introPlaying"
              :ref="(el) => { if (el) introRefs[6] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(6)"
              @play="onIntroPlay(6)"
              @pause="onIntroPause(6)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-6"></div>
            <div class="custom-thumbnail" v-show="!playerStates[6]?.hasStarted" @click="togglePlay(6)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(6).kicker">{{ getStepConfig(6).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(6).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[6]?.isPlaying && !playerStates[6]?.isBuffering && (playerStates[6]?.isReady || !playerStates[6]?.hasStarted)" @click="togglePlay(6)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[6]?.isBuffering || (playerStates[6]?.hasStarted && !playerStates[6]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 6">
              <button class="video-control-button video-play" type="button" @click="togglePlay(6)">{{ playerStates[6]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[6]?.progress || 0" @input="onSeekInput(6, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[6]?.currentTimeFormatted || "0:00" }} / {{ playerStates[6]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(6)">{{ playerStates[6]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(6)">⛶</button>
            </div>
          </div>
          <div class="bookmarks-container" v-if="courseData[6]?.bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[6].bookmarks" :key="bm.label" @click="seekToBookmark(6, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
            <summary>Buka Materi Bacaan</summary>
            <div class="lesson-reading">
              <header class="reading-header">
                <div>
                  <p class="label">Materi Bacaan 04</p>
                  <h3>Modular Design in Python</h3>
                  <p>Membagi program besar menjadi bagian-bagian kecil (function dan file terpisah).</p>
                </div>
                <span class="reading-badge">Konsep Utama</span>
              </header>

              <div class="concept-grid">
                <article class="concept-card">
                  <span class="concept-number">A</span>
                  <h4>Apa Itu Modular Design?</h4>
                  <p>Sama seperti di restoran di mana koki, kasir, dan pelayan punya tugas masing-masing, dalam pemrograman kita membagi kode besar menjadi function-function kecil yang fokus pada satu tugas.</p>
                </article>
                <article class="concept-card">
                  <span class="concept-number">B</span>
                  <h4>Reusable Code</h4>
                  <p>Function yang sudah dibuat bisa digunakan berkali-kali tanpa harus menulis ulang kode. Ini menghemat waktu dan membuat kode lebih rapi.</p>
                </article>
                <article class="concept-card">
                  <span class="concept-number">C</span>
                  <h4>Struktur File</h4>
                  <p>Pada proyek besar, function bisa disimpan di file terpisah (seperti <code>calculator.py</code>) dan dipanggil dari file utama (<code>main.py</code>).</p>
                </article>
              </div>

              <article class="reading-section">
                <h4>Mengimpor Function dari File Lain</h4>
                <p>Jika kita memisahkan function ke dalam file <code>calculator.py</code>, kita bisa memanggilnya di <code>main.py</code> menggunakan keyword <code>import</code>.</p>
                <div class="code-block">
                  <span class="keyword">from</span> calculator <span class="keyword">import</span> calculate_total<br><br>
                  <span class="keyword">total</span> = calculate_total(20000, 3)<br>
                  <span class="function">print</span>(<span class="string">"Total: "</span>, total)
                </div>
                <p><strong>Kenapa berguna?</strong> Mencari bug lebih mudah karena kita tinggal cek function mana yang bermasalah tanpa harus mengacak-acak seluruh program!</p>
              </article>
            </div>
          </details>
        </section>

        <section class="step-panel" id="step-7" v-show="currentStep === 7">
          <div class="video-frame" :class="{ 'player-ready': playerStates[7]?.isReady }" data-video-step="7">
            <video 
              v-show="playerStates[7]?.introPlaying"
              :ref="(el) => { if (el) introRefs[7] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(7)"
              @play="onIntroPlay(7)"
              @pause="onIntroPause(7)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-7"></div>
            <div class="custom-thumbnail" v-show="!playerStates[7]?.hasStarted" @click="togglePlay(7)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(7).kicker">{{ getStepConfig(7).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(7).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[7]?.isPlaying && !playerStates[7]?.isBuffering && (playerStates[7]?.isReady || !playerStates[7]?.hasStarted)" @click="togglePlay(7)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[7]?.isBuffering || (playerStates[7]?.hasStarted && !playerStates[7]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 7">
              <button class="video-control-button video-play" type="button" @click="togglePlay(7)">{{ playerStates[7]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[7]?.progress || 0" @input="onSeekInput(7, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[7]?.currentTimeFormatted || "0:00" }} / {{ playerStates[7]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(7)">{{ playerStates[7]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(7)">⛶</button>
            </div>
          </div>
          <div class="bookmarks-container" v-if="courseData[7]?.bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[7].bookmarks" :key="bm.label" @click="seekToBookmark(7, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          
          <div class="assignment-section">
            <div class="ide-container" style="background-color: #282c34; border-radius: 12px; padding: 20px; color: white; border: 4px solid var(--black); margin-bottom: 40px; box-shadow: 6px 6px 0px var(--black); margin-top: 20px;">
              <h3 style="margin-top: 0; color: var(--yellow); font-family: 'Outfit', sans-serif;">Mini Project: Kalkulator Keuangan</h3>
              <p style="font-family: 'Outfit', sans-serif; margin-bottom: 15px;">Tuliskan kode programmu di bawah ini.</p>
              <textarea id="python-ide-7" spellcheck="false" style="width: 100%; height: 300px; background-color: #1e1e1e; color: #d4d4d4; font-family: 'Courier New', Courier, monospace; font-size: 16px; padding: 15px; border-radius: 8px; border: 1px solid #444; margin-bottom: 15px; resize: vertical;"># Lanjutkan programmu di bawah ini:
</textarea>
              <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button onclick="window.runAssignmentCode7()" style="background-color: #4ade80; color: var(--black); font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid var(--black); cursor: pointer; font-family: 'Outfit', sans-serif; box-shadow: 3px 3px 0px var(--black);">▶ Jalankan Kode</button>
                <button onclick="window.submitAssignmentCode7()" style="background-color: #00c3ff; color: var(--white); font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid var(--black); cursor: pointer; font-family: 'Outfit', sans-serif; box-shadow: 3px 3px 0px var(--black);">📥 Submit Tugas</button>
              </div>
              <h4 style="margin-bottom: 5px; font-family: 'Outfit', sans-serif;">Console Output:</h4>
              <div id="ide-output-7" style="background-color: black; padding: 15px; border-radius: 8px; min-height: 100px; font-family: 'Courier New', Courier, monospace; white-space: pre-wrap; font-size: 14px; border: 1px solid #444;"></div>
            </div>
          </div>
        </section>

        <section class="step-panel" id="step-8" v-show="currentStep === 8">
          <div class="video-frame" :class="{ 'player-ready': playerStates[8]?.isReady }" data-video-step="8">
            <video 
              v-show="playerStates[8]?.introPlaying"
              :ref="(el) => { if (el) introRefs[8] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(8)"
              @play="onIntroPlay(8)"
              @pause="onIntroPause(8)"
              playsinline
              preload="auto"
            ></video>
            <div id="youtube-player-8"></div>
            <div class="custom-thumbnail" v-show="!playerStates[8]?.hasStarted" @click="togglePlay(8)">
              <div class="thumb-card-blue-bg"></div>
              <div class="thumb-card">
                <div class="thumb-kicker" v-if="getStepConfig(8).kicker">{{ getStepConfig(8).kicker }}</div>
                <div class="thumb-title">{{ getStepConfig(8).title }}</div>
                <svg class="thumb-decoration" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 L50 10 L90 50 L50 90 Z" fill="#ffe600" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M10 60 L50 100 L90 60" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M50 100 L50 90" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M10 60 L10 50" stroke="#1a1a1a" stroke-width="4"/>
                  <path d="M90 60 L90 50" stroke="#1a1a1a" stroke-width="4"/>
                </svg>
              </div>
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[8]?.isPlaying && !playerStates[8]?.isBuffering && (playerStates[8]?.isReady || !playerStates[8]?.hasStarted)" @click="togglePlay(8)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[8]?.isBuffering || (playerStates[8]?.hasStarted && !playerStates[8]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 8">
              <button class="video-control-button video-play" type="button" @click="togglePlay(8)">{{ playerStates[8]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[8]?.progress || 0" @input="onSeekInput(8, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[8]?.currentTimeFormatted || "0:00" }} / {{ playerStates[8]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(8)">{{ playerStates[8]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(8)">⛶</button>
            </div>
          </div>
          <div class="bookmarks-container" v-if="courseData[8]?.bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[8].bookmarks" :key="bm.label" @click="seekToBookmark(8, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
            <summary>Buka Materi Bacaan</summary>
            <div class="lesson-reading">
              <header class="reading-header">
                <div>
                  <p class="label">Materi Bacaan 05</p>
                  <h3>Bunga Majemuk & Loops 🔄</h3>
                  <p>Simulasi pertumbuhan uang dengan perulangan.</p>
                </div>
                <span class="reading-badge">Konsep Utama</span>
              </header>

              <div class="concept-grid">
                <article class="concept-card">
                  <span class="concept-number">A</span>
                  <h4>Apa Itu Bunga Majemuk?</h4>
                  <p>Bunga majemuk (Compound Interest) adalah bunga yang dihitung dari pokok awal ditambah akumulasi bunga periode sebelumnya. Ibarat ayam bertelur, "bunganya ikut berbunga lagi".</p>
                </article>
                <article class="concept-card">
                  <span class="concept-number">B</span>
                  <h4>Perbedaan dengan Bunga Tunggal</h4>
                  <p>Bunga tunggal selalu tetap setiap tahun, tapi bunga majemuk bertumbuh secara eksponensial karena dasar perhitungannya terus membesar.</p>
                </article>
                <article class="concept-card">
                  <span class="concept-number">C</span>
                  <h4>Mengapa Menggunakan Loop?</h4>
                  <p>Karena kita harus menghitung pertumbuhan uang dari tahun ke tahun secara berulang (Tahun 1, Tahun 2, dst.), Loop sangat tepat untuk mengotomatisasi perhitungan ini.</p>
                </article>
              </div>

              <article class="reading-section">
                <h4>Program Bunga Majemuk dengan Loop</h4>
                <p>Uang akan di-update di setiap perulangan (loop):</p>
                <div class="code-block">
                  <span class="keyword">money</span> = 100000<br>
                  <span class="keyword">rate</span> = 0.1<br>
                  <span class="keyword">years</span> = 3<br><br>
                  <span class="keyword">for</span> year <span class="keyword">in</span> <span class="function">range</span>(1, years + 1):<br>
                  &nbsp;&nbsp;&nbsp;&nbsp;interest = money * rate<br>
                  &nbsp;&nbsp;&nbsp;&nbsp;money = money + interest<br>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span class="function">print</span>("Tahun", year, ":", money)
                </div>
                <p>Output pada tahun ke-3 akan menjadi 133100.0, jauh lebih besar dibandingkan bunga tunggal biasa!</p>
              </article>
            </div>
          </details>
        </section>

        <div class="nav-buttons">
          <button class="nav-button secondary" type="button" :disabled="currentStep === 1" @click="prevStep()">
            ← Modul Sebelumnya
          </button>
          <button class="nav-button primary" type="button" :disabled="currentStep === 8" @click="nextStep()">
            Modul Berikutnya →
          </button>
        </div>
      </section>
    </main>

    <footer class="footer-note">
      Copyright © 2025 PT Ruang Raya Indonesia. Materi tidak boleh disebarluaskan tanpa izin.
    </footer>
  </div>

  
  <div class="quiz-overlay" id="quizOverlay" role="dialog" aria-modal="true" aria-labelledby="quizTitle" :class="{ open: quizState.isOpen }">
    <div class="quiz-dialog">
      <header class="quiz-header">
        <span class="quiz-header-icon" aria-hidden="true">?</span>
        <div>
          <p class="quiz-kicker">Checkpoint pemahaman</p>
          <h2 id="quizTitle">Mini Quiz Waktu!</h2>
          <p class="quiz-subtitle">Jawab berdasarkan materi yang baru kamu tonton.</p>
        </div>
      </header>
      <div class="quiz-body">
        <div class="quiz-progress" id="quizProgress" aria-label="Progres kuis">
          <span 
            v-for="(_, index) in quizState.shuffledQuestions" 
            :key="index" 
            class="quiz-dot"
            :class="{ 
              done: index < quizState.currentQuestionIdx, 
              active: index === quizState.currentQuestionIdx 
            }"
          ></span>
        </div>
        <div v-show="currentQuestion && !currentQuestion.html" class="quiz-question" id="quizQuestion">
          {{ currentQuestion ? currentQuestion.question : 'Memuat pertanyaan...' }}
        </div>
        <div v-if="currentQuestion && currentQuestion.html" id="quizCustomHtml" v-html="currentQuestion.html"></div>
        <div v-show="currentQuestion && !currentQuestion.html && getQuestionChoices(currentQuestion).length > 0" class="answer-row" id="answerRow">
          <button 
            v-for="(choice, cIdx) in getQuestionChoices(currentQuestion)" 
            :key="cIdx" 
            class="answer-button"
            :class="{ 
              true: choice === 'TRUE' || choice === 'True',
              false: choice === 'FALSE' || choice === 'False'
            }"
            @click="handleStandardAnswer(choice)"
            :disabled="quizState.choicesDisabled"
            :style="{ opacity: quizState.choicesDisabled ? (quizState.selectedChoice === choice ? 1 : 0.5) : 1 }"
          >
            {{ choice }}
          </button>
        </div>

        <div v-if="currentQuestion && currentQuestion.type === 'input'" class="input-container" style="display: flex; gap: 15px; flex-direction: row; align-items: center; margin-top: 20px;">
          <input type="text" v-model="quizState.inputAnswer" placeholder="..." :disabled="quizState.choicesDisabled" style="padding: 10px 14px; border-radius: 4px; border: 1px solid #757575; background: #ffffff; color: #000000; font-size: 16px; width: 120px; outline: none;">
          <button 
            :class="['cek-jawaban-btn', { 'disabled': !quizState.inputAnswer.trim() || quizState.choicesDisabled }]"
            :disabled="!quizState.inputAnswer.trim() || quizState.choicesDisabled"
            @click="submitInputAnswer"
          >Cek Jawaban!</button>
        </div>

        <div v-if="currentQuestion && currentQuestion.type === 'card_choice'" class="card-choice-container" style="display: flex; gap: 15px; flex-direction: row; align-items: stretch; margin-top: 15px;">
          <button 
            v-for="(card, cIdx) in currentQuestion.cards" 
            :key="cIdx"
            class="card-choice-btn"
            :disabled="quizState.choicesDisabled"
            :style="{ opacity: quizState.choicesDisabled ? (quizState.selectedChoice === card.id ? 1 : 0.5) : 1 }"
            @click="handleStandardAnswer(card.id)"
          >
            <div class="card-title" style="background-color: #00c3ff; color: #000; font-weight: 800; font-size: 16px; padding: 4px 12px; border-radius: 8px; border: 2px solid #000; display: inline-block; margin-bottom: 10px; box-shadow: 2px 2px 0px #000;">{{ card.title }}</div>
            <div class="card-text" style="text-align: left; font-size: 15px; font-weight: 600; color: #1a1a1a; line-height: 1.4;" v-html="card.html"></div>
          </button>
        </div>

        <div v-if="currentQuestion && currentQuestion.type === 'essay'" class="essay-container">
          <textarea v-model="quizState.essayAnswer" placeholder="Tulis jawaban logismu di sini..." rows="5" :disabled="quizState.choicesDisabled"></textarea>
          <div class="char-count" :class="{ 'error': quizState.essayAnswer.length < (currentQuestion.minChars || 150) }">
            {{ quizState.essayAnswer.length }} / {{ currentQuestion.minChars || 150 }} karakter minimal
          </div>
          <button 
            class="essay-submit-btn" 
            :disabled="quizState.essayAnswer.length < (currentQuestion.minChars || 150) || quizState.choicesDisabled"
            @click="submitEssayAnswer"
          >Kirim Jawaban</button>
        </div>
        <div class="quiz-feedback" id="quizFeedback" role="status" v-show="quizState.quizFeedback" :class="quizState.quizFeedbackType">
          <span v-html="quizState.quizFeedback"></span>
        </div>
        <div class="quiz-actions">
          <button class="quiz-review" type="button" @click="replayActiveQuizVideo">↺ Ulangi 30 detik video</button>
          <button class="quiz-next" type="button" v-show="quizState.isNextBtnVisible" @click="goToNextQuestion">{{ quizState.nextBtnText || (quizState.currentQuestionIdx < quizState.shuffledQuestions.length - 1 ? 'Soal berikutnya →' : 'Selesai →') }}</button>
        </div>
      </div>
    </div>
  </div>

  <div class="quiz-return" id="quizReturn" role="status" :class="{ visible: quizReturn.isVisible }">
    <p>Sudah cukup mengulang materinya? Kamu bisa kembali ke checkpoint kapan saja.</p>
    <button type="button" @click="returnToActiveQuiz">Kembali ke kuis sekarang →</button>
  </div>

  <div
    v-if="dashboardNotice.isOpen"
    class="dashboard-notice-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dashboardNoticeTitle"
    @click.self="closeDashboardNotice"
  >
    <section class="dashboard-notice-card" :class="dashboardNotice.type">
      <div class="dashboard-notice-icon" aria-hidden="true">{{ dashboardNoticeIcon }}</div>
      <div class="dashboard-notice-copy">
        <p class="dashboard-notice-kicker">Checkpoint belajar</p>
        <h3 id="dashboardNoticeTitle">{{ dashboardNotice.title }}</h3>
        <p>{{ dashboardNotice.message }}</p>
      </div>
      <button type="button" class="dashboard-notice-action" @click="closeDashboardNotice">
        {{ dashboardNotice.actionLabel }}
      </button>
    </section>
  </div>

  <div class="completion-toast" id="completionToast" role="status">
    Misi selesai. Kamu sudah mempelajari conditional, logical operator, dan penerapannya dalam perencanaan keuangan.
  </div>
</template>

<style>
.dashboard-notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(26, 26, 26, 0.42);
  backdrop-filter: blur(6px);
}

.dashboard-notice-card {
  width: min(440px, 100%);
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 16px;
  align-items: start;
  padding: 22px;
  background: #fff7d8;
  border: 4px solid #1a1a1a;
  border-radius: 18px;
  box-shadow: 10px 10px 0 #1a1a1a;
  color: #1a1a1a;
  animation: dashboard-notice-in 180ms ease-out both;
}

.dashboard-notice-card.success {
  background: #dcffe9;
}

.dashboard-notice-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border: 3px solid #1a1a1a;
  border-radius: 14px;
  background: #ffce4a;
  box-shadow: 4px 4px 0 #1a1a1a;
  font-weight: 900;
  font-size: 24px;
}

.dashboard-notice-card.success .dashboard-notice-icon {
  background: #27c881;
}

.dashboard-notice-copy {
  min-width: 0;
}

.dashboard-notice-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
  color: #5b5b5b;
}

.dashboard-notice-copy h3 {
  margin: 0 0 8px;
  font-size: 24px;
  line-height: 1.05;
}

.dashboard-notice-copy p:last-child {
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 700;
}

.dashboard-notice-action {
  grid-column: 1 / -1;
  justify-self: end;
  min-width: 132px;
  padding: 12px 18px;
  border: 3px solid #1a1a1a;
  border-radius: 12px;
  background: #1f6bff;
  color: #ffffff;
  box-shadow: 4px 4px 0 #1a1a1a;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.dashboard-notice-action:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 #1a1a1a;
}

@keyframes dashboard-notice-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 520px) {
  .dashboard-notice-card {
    grid-template-columns: 44px 1fr;
    gap: 12px;
    padding: 18px;
    border-radius: 14px;
    box-shadow: 7px 7px 0 #1a1a1a;
  }

  .dashboard-notice-icon {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    font-size: 19px;
  }

  .dashboard-notice-copy h3 {
    font-size: 21px;
  }

  .dashboard-notice-action {
    justify-self: stretch;
  }
}
</style>
