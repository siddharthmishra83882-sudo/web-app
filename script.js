// ======= Deck data =======
const STARTER_DECK = [
{q: "What does supervised learning mean?", a: "Learning from labeled data to map inputs to outputs."},
{q: "What is the difference between supervised and unsupervised learning?", a: "Supervised learning uses labeled data; unsupervised learning finds patterns in unlabeled data."},
{q: "What does overfitting mean in machine learning?", a: "When a model learns the training data too well and performs poorly on new, unseen data."},
{q: "What is a neural network?", a: "A computational model inspired by biological neurons that learns patterns through interconnected layers."},
{q: "What is cross-validation?", a: "A technique to evaluate model performance by splitting data into multiple train/test folds."},
{q: "What is regularization?", a: "Methods (like L1/L2) that penalize model complexity to reduce overfitting."},
{q: "What is gradient descent?", a: "An optimization algorithm to minimize a loss function by iteratively updating parameters."},
{q: "What is feature scaling and why is it used?", a: "Scaling features to similar ranges so models converge faster and perform better."}
]



// ======= Storage helpers =======
const STORAGE_KEY = 'flash_deck_progress_v1';


function loadState(){
try{
const raw = sessionStorage.getItem(STORAGE_KEY);
if(!raw) return null;
return JSON.parse(raw);
}catch(e){return null}
}
function saveState(state){
sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}



// ======= App state =======
let state = loadState() || {
deck: STARTER_DECK.map((c,i)=>({id:i,q:c.q,a:c.a,status:null})),
order: STARTER_DECK.map((_,i)=>i),
current: 0
};


// If deck length changed (new version), rebuild state
if(state.deck.length !== STARTER_DECK.length){
state = {
deck: STARTER_DECK.map((c,i)=>({id:i,q:c.q,a:c.a,status:null})),
order: STARTER_DECK.map((_,i)=>i),
current:0
};
saveState(state);
}


// ======= DOM refs =======
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const cardEl = document.getElementById('card');
const cardInner = document.getElementById('cardInner');
const showBtn = document.getElementById('showBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const knewBtn = document.getElementById('knewBtn');
const didntBtn = document.getElementById('didntBtn');
const scoreChip = document.getElementById('scoreChip');
const cardNumber = document.getElementById('cardNumber');
const progressBar = document.getElementById('progressBar');
const progressCount = document.getElementById('progressCount');
const knownCount = document.getElementById('knownCount');
const unknownCount = document.getElementById('unknownCount');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');


// ======= Utilities =======
function shuffle(array){
for(let i=array.length-1;i>0;i--){
const j=Math.floor(Math.random()*(i+1));
[array[i],array[j]]=[array[j],array[i]];
}
return array;
}

function updateUI(){
const order = state.order;
const idx = state.current;
const cardId = order[idx];
const card = state.deck.find(d=>d.id===cardId);
const total = state.order.length;


questionText.textContent = card.q;
answerText.textContent = card.a;
cardNumber.textContent = `Card ${idx+1} / ${total}`;


// disable prev/next appropriately
prevBtn.disabled = false; nextBtn.disabled = false;
// allow cycling


// score and progress
const known = state.deck.filter(d=>d.status==='known').length;
const unknown = state.deck.filter(d=>d.status==='unknown').length;
const reviewed = known + unknown;
scoreChip.textContent = `Known: ${known}`;
progressCount.textContent = `${reviewed} / ${total} reviewed`;
knownCount.textContent = `Known: ${known}`;
unknownCount.textContent = `Unknown: ${unknown}`;
const pct = Math.round((reviewed/total)*100);
progressBar.style.width = pct + '%';


// visual state for answered card
cardEl.classList.toggle('answered', !!card.status);


// update stored state
saveState(state);
}


function goTo(index){
const n = state.order.length;
state.current = ((index % n) + n) % n; // wrap
cardEl.classList.remove('flipped');
updateUI();
}


function showAnswer(){
cardEl.classList.add('flipped');
// focus on assessment
didntBtn.focus();
}
function hideAnswer(){
cardEl.classList.remove('flipped');
}


function mark(status){
const cardId = state.order[state.current];
const card = state.deck.find(d=>d.id===cardId);
card.status = status; // 'known' or 'unknown'
// move to next card automatically
updateUI();
}

// ======= Event wiring =======
showBtn.addEventListener('click', ()=>{
if(cardEl.classList.contains('flipped')) hideAnswer(); else showAnswer();
});
nextBtn.addEventListener('click', ()=> goTo(state.current+1));
prevBtn.addEventListener('click', ()=> goTo(state.current-1));
knewBtn.addEventListener('click', ()=>{ mark('known'); goTo(state.current+1); });
didntBtn.addEventListener('click', ()=>{ mark('unknown'); goTo(state.current+1); });


shuffleBtn.addEventListener('click', ()=>{
state.order = shuffle([...state.order]);
state.current = 0;
hideAnswer();
updateUI();
});
resetBtn.addEventListener('click', ()=>{
if(!confirm('Reset progress for this session?')) return;
state.deck.forEach(d=>d.status=null);
state.order = STARTER_DECK.map((_,i)=>i);
state.current = 0;
saveState(state);
hideAnswer();
updateUI();
});


exportBtn.addEventListener('click', ()=>{
const data = {deck: state.deck, order: state.order, current: state.current, exportedAt: new Date().toISOString()};
const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'flash_progress.json';
a.click();
URL.revokeObjectURL(url);
});


// keyboard shortcuts
window.addEventListener('keydown',(e)=>{
if(e.target.matches('input,textarea')) return;
if(e.key === ' '){ e.preventDefault(); showBtn.click(); }
if(e.key === 'ArrowRight'){ nextBtn.click(); }
if(e.key === 'ArrowLeft'){ prevBtn.click(); }
if(e.key.toLowerCase() === 'k'){ knewBtn.click(); }
if(e.key.toLowerCase() === 'd'){ didntBtn.click(); }
});


// initial render
updateUI();


// expose for debugging (optional)
window.flashApp = {state, saveState, loadState};