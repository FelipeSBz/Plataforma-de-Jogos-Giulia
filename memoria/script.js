// Jogo da Memória completo: temas, cronômetro, placar/histórico, responsivo, sons e novo jogo.
(function(){
  const allEmojis = ["🐶","🐱","🦊","🐼","🐸","🦁","🐵","🦄","🦉","🐙","🐢","🦖","🐝","🦋","🐞","🍎","🍕","⚽️"];
  const boardEl = document.getElementById('board');
  const difficultyEl = document.getElementById('difficulty');
  const themeEl = document.getElementById('theme');
  const startBtn = document.getElementById('startBtn');
  const voltarBtn = document.getElementById('voltarBtn');
  const timerEl = document.getElementById('timer');
  const movesEl = document.getElementById('moves');
  const matchesEl = document.getElementById('matches');
  const historyList = document.getElementById('historyList');
  const bestTimeEl = document.getElementById('bestTime');
  const bestMovesEl = document.getElementById('bestMoves');

  let deck = [], first=null, second=null, lock=false;
  let moves=0, matches=0, pairs=8;
  let seconds=0, timerInterval=null, running=false;

  // Sound using WebAudio
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  function tone(freq, duration=0.08){
    if(!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type='sine'; o.frequency.value = freq;
    g.gain.value = 0.06;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    setTimeout(()=>o.stop(), duration*1000+20);
  }
  function soundMatch(){ tone(880,0.12); tone(1320,0.08); }
  function soundFail(){ tone(220,0.12); }

  // History in localStorage
  function loadHistory(){ 
    try{
      return JSON.parse(localStorage.getItem('memory_history')||'[]');
    }catch(e){ return []; }
  }
  function saveHistory(hist){
    localStorage.setItem('memory_history', JSON.stringify(hist));
  }
  function addHistory(entry){
    const hist = loadHistory();
    hist.unshift(entry);
    if(hist.length>30) hist.pop();
    saveHistory(hist);
    renderHistory();
  }
  function renderHistory(){
    const hist = loadHistory();
    historyList.innerHTML = '';
    hist.forEach(h=>{
      const li = document.createElement('li');
      li.textContent = `${h.date} • ${h.difficulty} pares • ${h.time} • ${h.moves} mov.`;
      historyList.appendChild(li);
    });
    updateBest();
  }

  function updateBest(){
    const hist = loadHistory();
    if(hist.length===0){ bestTimeEl.textContent='—'; bestMovesEl.textContent='—'; return; }
    // Best time and best moves
    const byTime = hist.slice().sort((a,b)=>toSeconds(a.time)-toSeconds(b.time))[0];
    const byMoves = hist.slice().sort((a,b)=>a.moves-b.moves)[0];
    bestTimeEl.textContent = byTime ? byTime.time : '—';
    bestMovesEl.textContent = byMoves ? byMoves.moves : '—';
  }

  function toSeconds(timestr){
    if(!timestr) return 999999;
    const [m,s] = timestr.split(':').map(Number);
    return m*60 + s;
  }

  function formatTime(s){
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }

  function startTimer(){
    if(timerInterval) clearInterval(timerInterval);
    seconds=0; timerEl.textContent = formatTime(0);
    timerInterval = setInterval(()=>{
      seconds++; timerEl.textContent = formatTime(seconds);
    },1000);
    running=true;
  }
  function stopTimer(){
    clearInterval(timerInterval); timerInterval=null; running=false;
  }

  function buildDeck(pairsCount){
    const selected = allEmojis.slice(0, pairsCount);
    const arr = [...selected, ...selected];
    // random shuffle
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  function setCols(p){
    // adjust cols for responsiveness and layout
    let cols = 4;
    if(p<=4) cols=4;
    else if(p===6) cols=6;
    else if(p===8) cols=4;
    else if(p===12) cols=6;
    document.documentElement.style.setProperty('--cols', cols);
  }

  function renderBoard(){
    boardEl.innerHTML = '';
    deck.forEach((emoji, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'card-tile';
      btn.setAttribute('data-idx', idx);
      btn.setAttribute('aria-label','Carta');
      btn.tabIndex = 0;
      btn.addEventListener('click', ()=>flipCard(btn));
      btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); flipCard(btn); }});
      boardEl.appendChild(btn);
    });
  }

  function flipCard(btn){
    if(lock) return;
    if(btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
    if(!running) startTimer();
    const idx = Number(btn.dataset.idx);
    reveal(btn, deck[idx]);
    if(!first){
      first = btn;
    } else if(first === btn){
      return;
    } else {
      second = btn;
      lock = true;
      moves++; movesEl.textContent = moves;
      if(first.textContent === second.textContent){
        // match
        first.classList.add('matched');
        second.classList.add('matched');
        matches++; matchesEl.textContent = matches + '/' + pairs;
        soundMatch();
        resetPick();
        if(matches === pairs){
          // finished
          stopTimer();
          const record = { date: new Date().toLocaleString(), difficulty: pairs, time: formatTime(seconds), moves };
          addHistory(record);
          setTimeout(()=>alert(`Parabéns! Você venceu em ${formatTime(seconds)} e ${moves} movimentos.`), 200);
        }
      } else {
        // fail
        soundFail();
        setTimeout(()=>{
          hide(first); hide(second);
          resetPick();
        },700);
      }
    }
  }

  function reveal(el, emoji){
    el.classList.add('flipped');
    el.textContent = emoji;
  }
  function hide(el){
    el.classList.remove('flipped');
    el.textContent = '';
  }
  function resetPick(){
    first = null; second = null; lock = false;
  }

  function startGame(){
    pairs = Number(difficultyEl.value);
    setCols(pairs);
    deck = buildDeck(pairs);
    moves = 0; matches = 0;
    movesEl.textContent = moves;
    matchesEl.textContent = matches + '/' + pairs;
    seconds = 0; timerEl.textContent = formatTime(0);
    stopTimer();
    renderBoard();
  }

  // New game: shuffle current difficulty and restart
  function newGame(){
    startGame();
    // small animation: briefly flash board
    boardEl.style.transition='transform 200ms';
    boardEl.style.transform='scale(0.99)';
    setTimeout(()=>{ boardEl.style.transform=''; },140);
  }
  
  function voltar() {
     window.location.href = '../index.html';
  }

  // Theme switch
  function applyTheme(){
    const t = themeEl.value;
    if(t==='dark') document.documentElement.setAttribute('data-theme','dark');
    else if(t==='colorful') document.documentElement.setAttribute('data-theme','colorful');
    else document.documentElement.removeAttribute('data-theme');
  }

  // Event listeners
  startBtn.addEventListener('click', ()=>startGame());
  voltarBtn.addEventListener('click', ()=>voltar());
  themeEl.addEventListener('change', applyTheme);

  // Initialize UI
  renderHistory();
  applyTheme();
  // Start default game
  startGame();

  // Accessibility: focus first card after start
  startBtn.addEventListener('click', ()=>{ setTimeout(()=>{ const c = boardEl.querySelector('.card-tile'); if(c) c.focus(); }, 200); });
})();
