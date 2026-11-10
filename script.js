/**
 * QuizNova - Application Logic
 * Clean, modular Vanilla JS implementation.
 */

// --- 1. Quiz Data ---
const quizData = [
    {
        question: "What is the correct syntax for referring to an external script called 'app.js'?",
        options: ["<script href='app.js'>", "<script name='app.js'>", "<script src='app.js'>", "<script file='app.js'>"],
        correct: 2,
        explanation: "The 'src' attribute is used in the <script> tag to link external JavaScript files."
    },
    {
        question: "Which CSS property controls the text size?",
        options: ["font-style", "text-size", "font-size", "text-style"],
        correct: 2,
        explanation: "The 'font-size' property is the standard CSS property used to adjust the size of text."
    },
    {
        question: "How do you declare a JavaScript variable that cannot be reassigned?",
        options: ["let", "var", "const", "static"],
        correct: 2,
        explanation: "The 'const' keyword declares a block-scoped variable whose value cannot be reassigned."
    },
    {
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink and Text Markup Language", "Home Tool Markup Language"],
        correct: 0,
        explanation: "HTML stands for Hyper Text Markup Language, the standard markup language for documents designed to be displayed in a web browser."
    },
    {
        question: "Which array method creates a new array with the results of calling a function for every array element?",
        options: ["forEach()", "filter()", "reduce()", "map()"],
        correct: 3,
        explanation: "The map() method creates a new array populated with the results of calling a provided function on every element in the calling array."
    },
    {
        question: "In CSS Flexbox, which property defines the alignment of items along the main axis?",
        options: ["align-items", "justify-content", "flex-direction", "align-content"],
        correct: 1,
        explanation: "justify-content aligns the flexible container's items when the items do not use all available space on the main-axis."
    },
    {
        question: "What is the purpose of the 'alt' attribute in an <img> tag?",
        options: ["To style the image", "To provide alternative text for screen readers", "To link the image to another page", "To set the image dimensions"],
        correct: 1,
        explanation: "The alt attribute provides accessibility for screen readers and displays text if the image fails to load."
    },
    {
        question: "Which symbol is used for strict equality comparison in JavaScript?",
        options: ["=", "==", "===", "!="],
        correct: 2,
        explanation: "The '===' operator checks for strict equality, meaning both the value and the type must be the same."
    },
    {
        question: "How do you select an element with id 'demo' in CSS?",
        options: [".demo", "#demo", "*demo", "demo"],
        correct: 1,
        explanation: "In CSS, the hash (#) symbol is used to select elements by their ID."
    },
    {
        question: "Which of the following is NOT a valid HTTP method?",
        options: ["GET", "POST", "PUSH", "DELETE"],
        correct: 2,
        explanation: "PUSH is not a standard HTTP request method. Standard methods include GET, POST, PUT, DELETE, PATCH, etc."
    }
];

// --- 2. Application State ---
let currentQuestionIndex = 0;
let userAnswers = new Array(quizData.length).fill(null);
let timeRemaining = 600; // 10 minutes in seconds
let timerInterval = null;
let isMuted = true;
let isQuizActive = false;

// --- 3. DOM Elements ---
const screens = {
    start: document.getElementById('start-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    review: document.getElementById('review-screen')
};

const UI = {
    startBtn: document.getElementById('start-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    submitBtn: document.getElementById('submit-btn'),
    restartBtn: document.getElementById('restart-btn'),
    reviewBtn: document.getElementById('review-btn'),
    backToResultsBtn: document.getElementById('back-to-results-btn'),
    
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    questionCounter: document.getElementById('question-counter'),
    progressBar: document.getElementById('progress-bar'),
    timerDisplay: document.getElementById('timer-display'),
    
    themeToggle: document.getElementById('theme-toggle'),
    soundToggle: document.getElementById('sound-toggle'),
    
    confirmModal: document.getElementById('confirm-modal'),
    modalCancel: document.getElementById('modal-cancel'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalWarningText: document.getElementById('modal-warning-text')
};

// --- 4. Initialization & Event Listeners ---
function init() {
    UI.startBtn.addEventListener('click', startQuiz);
    UI.prevBtn.addEventListener('click', () => navigateQuestion(-1));
    UI.nextBtn.addEventListener('click', () => navigateQuestion(1));
    UI.submitBtn.addEventListener('click', handleManualSubmit);
    UI.restartBtn.addEventListener('click', resetQuiz);
    UI.reviewBtn.addEventListener('click', showReviewScreen);
    UI.backToResultsBtn.addEventListener('click', () => switchScreen('result'));
    
    UI.themeToggle.addEventListener('click', toggleTheme);
    UI.soundToggle.addEventListener('click', toggleSound);
    
    UI.modalCancel.addEventListener('click', () => UI.confirmModal.classList.add('hidden'));
    UI.modalConfirm.addEventListener('click', finishQuiz);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNav);
}

// --- 5. Core Functions ---
function switchScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    screens[screenName].classList.add('active');
}

function startQuiz() {
    playSound('start');
    isQuizActive = true;
    switchScreen('quiz');
    UI.timerDisplay.classList.remove('hidden');
    startTimer();
    loadQuestion();
}

function loadQuestion() {
    const currentQ = quizData[currentQuestionIndex];
    
    // Update Header & Progress
    UI.questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
    UI.progressBar.style.width = `${((currentQuestionIndex + 1) / quizData.length) * 100}%`;
    
    // Update Question Text
    UI.questionText.textContent = currentQ.question;
    
    // Clear & Generate Options
    UI.optionsContainer.innerHTML = '';
    currentQ.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = option;
        
        // Restore previous selection if exists
        if (userAnswers[currentQuestionIndex] === index) {
            btn.classList.add('selected');
        }
        
        btn.addEventListener('click', () => selectOption(index, btn));
        UI.optionsContainer.appendChild(btn);
    });

    updateNavigationButtons();
}

function selectOption(index, buttonElement) {
    if (!isQuizActive) return;
    playSound('click');
    
    // Update state
    userAnswers[currentQuestionIndex] = index;
    
    // Update UI
    const allOptions = UI.optionsContainer.querySelectorAll('.option-btn');
    allOptions.forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
}

function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < quizData.length) {
        currentQuestionIndex = newIndex;
        loadQuestion();
    }
}

function updateNavigationButtons() {
    UI.prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.length - 1) {
        UI.nextBtn.classList.add('hidden');
        UI.submitBtn.classList.remove('hidden');
    } else {
        UI.nextBtn.classList.remove('hidden');
        UI.submitBtn.classList.add('hidden');
    }
}

// --- 6. Timer Logic ---
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 60) {
            UI.timerDisplay.classList.add('warning');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            finishQuiz(); // Auto submit
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    UI.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- 7. Submission & Scoring ---
function handleManualSubmit() {
    const unansweredCount = userAnswers.filter(ans => ans === null).length;
    
    if (unansweredCount > 0) {
        UI.modalWarningText.innerHTML = `You have <strong>${unansweredCount} unanswered</strong> questions.<br>Are you sure you want to submit?`;
    } else {
        UI.modalWarningText.textContent = "Are you sure you want to submit your answers?";
    }
    
    UI.confirmModal.classList.remove('hidden');
}

function finishQuiz() {
    isQuizActive = false;
    clearInterval(timerInterval);
    UI.confirmModal.classList.add('hidden');
    UI.timerDisplay.classList.add('hidden');
    playSound('finish');
    
    calculateAndShowResults();
}

function calculateAndShowResults() {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    userAnswers.forEach((ans, index) => {
        if (ans === null) {
            unanswered++;
        } else if (ans === quizData[index].correct) {
            correct++;
        } else {
            incorrect++;
        }
    });

    const percentage = Math.round((correct / quizData.length) * 100);

    // Update DOM
    document.getElementById('stat-total').textContent = quizData.length;
    document.getElementById('stat-correct').textContent = correct;
    document.getElementById('stat-incorrect').textContent = incorrect;
    document.getElementById('stat-unanswered').textContent = unanswered;
    
    const percentageEl = document.getElementById('final-percentage');
    percentageEl.textContent = `${percentage}%`;

    const messageEl = document.getElementById('performance-message');
    if (percentage >= 90) messageEl.textContent = "Outstanding Performance! 🏆";
    else if (percentage >= 70) messageEl.textContent = "Great Job! You Passed! ✅";
    else messageEl.textContent = "Keep Practicing! You'll get it next time. 📚";

    switchScreen('result');
}

// --- 8. Review Screen ---
function showReviewScreen() {
    const container = document.getElementById('review-container');
    container.innerHTML = '';

    quizData.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correct;
        
        let statusClass = 'unanswered';
        let statusText = 'Not Answered';
        
        if (userAnswer !== null) {
            statusClass = isCorrect ? 'correct' : 'incorrect';
            statusText = isCorrect ? 'Correct' : 'Incorrect';
        }

        const reviewHtml = `
            <div class="review-item ${statusClass}">
                <h4>Q${index + 1}: ${q.question}</h4>
                <p><strong>Your Answer:</strong> ${userAnswer !== null ? q.options[userAnswer] : '<em>Skipped</em>'}</p>
                ${!isCorrect ? `<p><strong>Correct Answer:</strong> ${q.options[q.correct]}</p>` : ''}
                <div class="review-explanation">
                    <small>💡 ${q.explanation}</small>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', reviewHtml);
    });

    switchScreen('review');
}

// --- 9. Utilities & Extras ---
function resetQuiz() {
    currentQuestionIndex = 0;
    userAnswers = new Array(quizData.length).fill(null);
    timeRemaining = 600;
    UI.timerDisplay.classList.remove('warning');
    switchScreen('start');
}

function handleKeyboardNav(e) {
    if (!isQuizActive) return;
    if (e.key === 'ArrowRight' && currentQuestionIndex < quizData.length - 1) {
        navigateQuestion(1);
    } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        navigateQuestion(-1);
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    UI.themeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
}

function toggleSound() {
    isMuted = !isMuted;
    UI.soundToggle.textContent = isMuted ? '🔇' : '🔊';
}

// Web Audio API syntheizer for zero-dependency sound effects
function playSound(type) {
    if (isMuted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'start' || type === 'finish') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch(e) { console.log('Web Audio API not supported'); }
}

// Initialize application on load
init();