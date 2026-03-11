let examData = null;
let currentSectionIndex = 0;
let currentQuestionIndex = 0;
let userAnswers = []; // מבנה: [{ answers: [null, 0, 1, ...] }, ...]
let timerInterval = null;
let timeRemaining = 0;

const startBtn = document.getElementById('start-btn');
const loading = document.getElementById('loading');

startBtn.addEventListener('click', startExam);
document.getElementById('prev-question').addEventListener('click', () => loadQuestion(currentQuestionIndex - 1));
document.getElementById('next-question').addEventListener('click', () => loadQuestion(currentQuestionIndex + 1));
document.getElementById('finish-section').addEventListener('click', finishSection);

async function startExam() {
    startBtn.style.display = 'none';
    loading.style.display = 'block';
    
    try {
        const response = await fetch('/generate_exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        examData = data;
        // אתחול מערך התשובות ריק לכל פרק
        userAnswers = examData.sections.map(s => ({ answers: Array(s.questions.length).fill(null) }));
        
        document.getElementById('welcome-screen').classList.remove('active');
        document.getElementById('exam-screen').classList.add('active');
        loadSection(0);
    } catch (e) {
        alert("שגיאה ביצירת המבחן: " + e.message);
        location.reload();
    }
}

function loadSection(index) {
    currentSectionIndex = index;
    const section = examData.sections[index];
    timeRemaining = section.time_minutes * 60;
    startTimer();
    
    document.getElementById('section-title').textContent = section.type;
    document.getElementById('instructions').textContent = section.instructions;
    
    const pBox = document.getElementById('passage-box');
    if (section.passage) {
        pBox.style.display = 'block';
        document.getElementById('passage-text').textContent = section.passage;
    } else {
        pBox.style.display = 'none';
    }
    
    loadQuestion(0);
}

function loadQuestion(index) {
    currentQuestionIndex = index;
    const section = examData.sections[currentSectionIndex];
    const q = section.questions[index];
    
    document.getElementById('section-progress').textContent = `שאלה ${index + 1} מתוך ${section.questions.length}`;
    document.getElementById('question-text').textContent = q.text;
    
    const opts = document.getElementById('options');
    opts.innerHTML = '';
    q.options.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = 'option' + (userAnswers[currentSectionIndex].answers[index] === i ? ' selected' : '');
        div.textContent = opt;
        div.onclick = () => {
            userAnswers[currentSectionIndex].answers[index] = i;
            loadQuestion(index);
        };
        opts.appendChild(div);
    });

    document.getElementById('prev-question').disabled = index === 0;
    const isLast = index === section.questions.length - 1;
    document.getElementById('next-question').style.display = isLast ? 'none' : 'inline-block';
    document.getElementById('finish-section').style.display = isLast ? 'inline-block' : 'none';
    renderNav();
}

function renderNav() {
    const nav = document.getElementById('question-nav');
    nav.innerHTML = '';
    examData.sections[currentSectionIndex].questions.forEach((_, i) => {
        const btn = document.createElement('div');
        // בתוך פונקציית renderNav, שנה את השורה הזו:
        btn.className = `question-btn ${userAnswers[currentSectionIndex].answers[i] !== null ? 'answered' : ''} ${i === currentQuestionIndex ? 'current' : ''}`;
        btn.onclick = () => loadQuestion(i);
        nav.appendChild(btn);
    });
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeRemaining--;
        const m = Math.floor(timeRemaining / 60);
        const s = timeRemaining % 60;
        document.getElementById('timer').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeRemaining <= 0) finishSection();
    }, 1000);
}

function finishSection() {
    if (currentSectionIndex < examData.sections.length - 1) {
        if (confirm("לעבור לפרק הבא? לא תוכל לחזור.")) {
            loadSection(currentSectionIndex + 1);
        }
    } else {
        showSummary();
    }
}

// פונקציית הסיכום המעודכנת שמציגה תשובות והסברים
function showSummary() {
    clearInterval(timerInterval);
    let correct = 0;
    let total = 0;
    const resultsContainer = document.getElementById('detailed-results');
    resultsContainer.innerHTML = '<h2>פירוט תשובות והסברים</h2>';

    examData.sections.forEach((section, si) => {
        const sectionTitle = document.createElement('h3');
        sectionTitle.className = 'summary-section-title';
        sectionTitle.textContent = section.type;
        resultsContainer.appendChild(sectionTitle);

        section.questions.forEach((q, qi) => {
            total++;
            const uAns = userAnswers[si].answers[qi];
            const isCorrect = uAns === q.correct_index;
            if (isCorrect) correct++;

            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${isCorrect ? 'correct' : 'wrong'}`;
            
            resultItem.innerHTML = `
                <div class="result-question"><strong>שאלה ${qi + 1}:</strong> ${q.text}</div>
                <div class="result-user-answer">
                    התשובה שלך: <span class="${isCorrect ? 'text-success' : 'text-danger'}">
                        ${uAns !== null ? q.options[uAns] : 'לא נענה'}
                    </span>
                </div>
                ${!isCorrect ? `<div class="result-correct-answer">התשובה הנכונה: <span class="text-success">${q.options[q.correct_index]}</span></div>` : ''}
                <div class="result-explanation"><strong>הסבר:</strong> ${q.explanation}</div>
            `;
            resultsContainer.appendChild(resultItem);
        });
    });

    const acc = correct / total;
    const score = Math.round(50 + (acc * 100)); // חישוב ציון אמירנ"ט 50-150
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('accuracy').textContent = Math.round(acc * 100) + "%";
    
    document.getElementById('exam-screen').classList.remove('active');
    document.getElementById('summary-screen').classList.add('active');
}