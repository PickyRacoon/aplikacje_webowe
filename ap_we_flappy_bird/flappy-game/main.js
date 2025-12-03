
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');    // glowny obszar gry
  const startScreenEl = document.getElementById('startScreen');
  const BASE_W = 288; // logiczny rozmiar gry
  const BASE_H = 512; 

  // canvas przeskalowany aby zachowac proporcje
  let scale = 1;
  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas(){
    const displayW = window.innerWidth;  // rozmiar okna przegladarki
    const displayH = window.innerHeight;
    // wybierz skalę aby cała gra była widoczna
    scale = Math.min(displayW / BASE_W, displayH / BASE_H);
    // ustawienie rozmiaru 
    const cssW = Math.round(BASE_W * scale);
    const cssH = Math.round(BASE_H * scale);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    canvas.width = Math.round(cssW);
    canvas.height = Math.round(cssH);
    updateStartOverlaySize();
  }
  // startowe przeskalowanie i przy zmianie rozmiaru okna
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // rysowanie na canvasie
  if(startScreenEl) startScreenEl.classList.add('hidden');

  // rozpoczecie gry przez klikniecie
  canvas.addEventListener('click', ()=>{
    if(state === 'start') startGame();
  });

  function updateStartOverlaySize(){
    if(!startScreenEl) return;
    // skopiowany wyliczony rozmiar
    const cssW = canvas.style.width || '';
    const cssH = canvas.style.height || '';
    startScreenEl.style.width = cssW;
    startScreenEl.style.height = cssH;
  }

  const ASSET_ROOT = '../assets/Flappy Bird/';
  const SFX_ROOT = '../assets/Sound Efects/';

  const images = {};
  const sounds = {};

  function loadImage(key, src){
    return new Promise((res,rej)=>{
      const img = new Image();
      img.onload = ()=>{ images[key]=img; res(img); };
      img.onerror = ()=>{ console.warn('Nie udało się załadować obrazu', src); res(null); };
      img.src = src;
    });
  }
  function loadAudio(key, src, loop=false){
    return new Promise((res,rej)=>{
      const a = new Audio();
      a.src = src;
      a.loop = loop;
      a.oncanplaythrough = ()=>{ sounds[key]=a; res(a); };
      a.onerror = ()=>{ console.warn('Nie udało się załadować dźwięku', src); res(null); };
    });
  }

  const loaders = [];
  loaders.push(loadImage('bg', ASSET_ROOT + encodeURIComponent('background-day.png')));
  loaders.push(loadImage('base', ASSET_ROOT + encodeURIComponent('base.png')));
  loaders.push(loadImage('pipe', ASSET_ROOT + encodeURIComponent('pipe-green.png')));
  loaders.push(loadImage('bird1', ASSET_ROOT + encodeURIComponent('yellowbird-upflap.png')));
  loaders.push(loadImage('bird2', ASSET_ROOT + encodeURIComponent('yellowbird-midflap.png')));
  loaders.push(loadImage('bird3', ASSET_ROOT + encodeURIComponent('yellowbird-downflap.png')));
  // cyfry do wyniku 
  const NUM_ROOT = '../assets/UI/Numbers/';
  for(let i=0;i<10;i++){ loaders.push(loadImage('num'+i, NUM_ROOT + i + '.png')); }

  loaders.push(loadImage('startMsg', '../assets/UI/message.png'));
  loaders.push(loadImage('gameoverMsg', '../assets/UI/gameover.png'));

  loaders.push(loadAudio('wing', SFX_ROOT + encodeURIComponent('wing.wav')));
  loaders.push(loadAudio('point', SFX_ROOT + encodeURIComponent('point.wav')));
  loaders.push(loadAudio('hit', SFX_ROOT + encodeURIComponent('hit.wav')));
  loaders.push(loadAudio('die', SFX_ROOT + encodeURIComponent('die.wav')));
  loaders.push(loadAudio('swoosh', SFX_ROOT + encodeURIComponent('swoosh.wav')));

  let lastTime = 0;

  // Stan gry
  let state = 'start'; 
  const gravity = 0.45; // sila grawitacji
  const flapVel = -7.5; // predkosc skoku ptaka w gore

  class Bird {
    constructor(){
      this.x = 60;
      this.y = BASE_H/2;
      this.vy = 0;
      this.rotation = 0; // radiany
      this.frame = 0;
      this.frameTimer = 0;
      this.width = 34; this.height = 24; // rozmiar hitboxu
    }
    update(dt){
      if(state === 'playing' || state==='falling' || state==='recordSpin'){
        this.vy += gravity;
        this.y += this.vy;
        if(this.vy < 0) this.rotation = -0.4;
        else this.rotation = Math.min(1.2, this.rotation + 0.03);
      }
      // klatki animacji
      this.frameTimer += dt;
      if(this.frameTimer > 80){ this.frame = (this.frame+1)%3; this.frameTimer = 0; }
    }
    flap(){ this.vy = flapVel; if(sounds.wing){ try{ sounds.wing.currentTime=0; sounds.wing.play(); } catch(e){} } }
    draw(ctx){
      const img = images['bird' + (this.frame+1)];
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      if(img) ctx.drawImage(img, -img.width/2, -img.height/2);
      else {
        ctx.fillStyle = 'yellow'; ctx.fillRect(-12,-10,24,20);
      }
      ctx.restore();
    }
    getBounds(){ return {x:this.x-12,y:this.y-10,w:24,h:20}; }
  }

  class Pipe {
    constructor(x,gapY){
      this.x = x; this.width = 52; this.gap = 100; this.gapY = gapY; this.passed=false;
    }
    update(dt, speed){ this.x -= speed * dt/16; }
    draw(ctx){
      const pipeImg = images.pipe;
      // gorna rurka
      if(pipeImg){
        const topH = pipeImg.height;
        // narysuj gora ale odwrocona
        ctx.save();
        ctx.translate(this.x + this.width/2, this.gapY - this.gap/2 - topH/2);
        ctx.scale(1,-1);
        ctx.drawImage(pipeImg, -pipeImg.width/2, -pipeImg.height/2);
        ctx.restore();
        // dolna rurka
        ctx.drawImage(pipeImg, this.x, this.gapY + this.gap/2);
      } else {
        ctx.fillStyle='green'; ctx.fillRect(this.x,0,this.width,this.gapY - this.gap/2);
  ctx.fillRect(this.x,this.gapY + this.gap/2,this.width,BASE_H);
      }
    }
    collides(b){
      // prostokat kolizji
      const birdBox = b.getBounds();
      const topRect = {x:this.x,y:0,w:this.width,h:this.gapY - this.gap/2};
      const botRect = {x:this.x,y:this.gapY + this.gap/2,w:this.width,h:BASE_H - (this.gapY + this.gap/2)};
      function overlap(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
      return overlap(birdBox, topRect) || overlap(birdBox, botRect);
    }
  }


  // zmienne gry
  const bird = new Bird();
  let pipes = [];
  let pipeTimer = 0;
  let pipeInterval = 1500;
  let speed = 2.2; // predkosz przewijania w poziomie
  let score = 0;
  let bestScores = loadLeaderboard();
  let lastScore = 0;

  // wejscie
  let pressed = false;
  window.addEventListener('keydown', e=>{
    if(e.code === 'Space'){
      e.preventDefault();
      if(state === 'start'){ startGame(); }
      if(state === 'playing'){
        bird.flap();
      }
      if(state === 'dead'){ /* ignoruj az retry */ }
    }
  });

   
  const retryBtnEl = document.getElementById('retryBtn');
  if(retryBtnEl){ retryBtnEl.addEventListener('click', ()=>{ resetGame(); startGame(); }); }
  const congratsBtnEl = document.getElementById('congratsBtn');
  if(congratsBtnEl){ congratsBtnEl.addEventListener('click', ()=>{ document.getElementById('congratsScreen').classList.add('hidden'); showGameOver(); }); }

  // start the game 
  function startGame(){
    state = 'playing';
    if(startScreenEl) startScreenEl.classList.add('hidden');
    pipeTimer = 0; pipes = []; score = 0; bird.x = 60; bird.y = BASE_H/2; bird.vy = 0; bird.rotation=0;
  }

  function resetGame(){
    state = 'start';
    if(startScreenEl) startScreenEl.classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('congratsScreen').classList.add('hidden');
  }

  function spawnPipe(){
    const minY = 120, maxY = BASE_H-150;
    const gapY = Math.floor(Math.random()*(maxY-minY)+minY);
    pipes.push(new Pipe(BASE_W, gapY));
  }

  function update(dt){
    // zawsze aktualizuj ptaka gdy jest w aktywnym stanie aby mógł spadać
    if(state === 'playing' || state === 'falling' || state === 'recordSpin'){
      bird.update(dt);
    }

    // spawn rur tylko podczas grania
    if(state === 'playing'){
      pipeTimer += dt;
      if(pipeTimer > pipeInterval){ pipeTimer = 0; spawnPipe(); }
    }

    // aktualizuj ruch rur
    for(const p of pipes){ p.update(dt, speed); }

    // kolizje i punktowanie tylko podczas grania
    if(state === 'playing'){
      for(const p of pipes){
        if(!p.passed && p.x + p.width < bird.x){
          p.passed = true;
          score += 1;
          if(sounds.point){ try{ sounds.point.currentTime=0; sounds.point.play(); }catch(e){} }
        }
        if(p.collides(bird)){
          onHit();
        }
      }
    }

    // usuwanie rurek poza ekranem
    pipes = pipes.filter(p=>p.x > -100);

    const groundY = BASE_H - (images.base? images.base.height : 112);
  
    if(state !== 'falling' && state !== 'dead' && state !== 'recordSpin' && bird.y + 12 >= groundY){
      onHit();
    }

    if(state === 'falling'){
      if(bird.y + 12 >= groundY){
        bird.y = groundY - 12;
        finalizeGame();
      }
    }
  }

  let recordSpinTimer = 0;
  function onHit(){
    if(state === 'playing'){
      state = 'falling';
      if(sounds.hit){ try{ sounds.hit.currentTime=0; sounds.hit.play(); }catch(e){} }
      // daj ptakowi ped w dol aby szybciej spadal na ziemie
      bird.vy = 8;
      bird.rotation = 1.0;
      // dzwiek smierci
      setTimeout(()=>{ if(sounds.die) try{ sounds.die.play(); }catch(e){} }, 150);
    }
  }

  function finalizeGame(){
    state = 'dead';
    lastScore = score;
    bestScores = insertScore(lastScore);
    // sprawdzenie czy to nowy rekord
    if(bestScores[0] === lastScore){
      state = 'recordSpin';
      recordSpinTimer = 0;

      const spinDuration = 3000;
      const spinInterval = setInterval(()=>{
        recordSpinTimer += 100;
        bird.rotation += 0.8;
        if(recordSpinTimer >= spinDuration){ clearInterval(spinInterval); state='congrats'; document.getElementById('congratsScreen').classList.remove('hidden'); }
      }, 100);
    } else {
      showGameOver();
    }
  }

  function showGameOver(){
    state = 'dead';
    document.getElementById('lastScore').textContent = lastScore;

    const lb = document.getElementById('leaderboard');
    if(lb){
      lb.innerHTML = '';
      for(let i=0;i<Math.min(5,bestScores.length);i++){ const li=document.createElement('li'); li.textContent = bestScores[i]; lb.appendChild(li); }
    }
    document.getElementById('gameOverScreen').classList.remove('hidden');
  }

  function insertScore(s){
    const key = 'flappy_leaderboard_v1';
    const arr = JSON.parse(localStorage.getItem(key)||'[]');
    arr.push(s);
    arr.sort((a,b)=>b-a);
    while(arr.length>5) arr.pop();
    localStorage.setItem(key, JSON.stringify(arr));
    return arr;
  }
  function loadLeaderboard(){ const arr = JSON.parse(localStorage.getItem('flappy_leaderboard_v1')||'[]'); return arr; }

  // rysowanie
  function draw(){
    // wyczysc canvas
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    // narysuj tlo w obrebie logicznego obszaru gry
    if(images.bg){
      ctx.drawImage(images.bg, 0, 0, BASE_W, BASE_H);
    } else {
      ctx.fillStyle = '#70c5ce';
      ctx.fillRect(0,0,BASE_W,BASE_H);
    }

    // narysuj komunikat startowy na wierzchu tla
    if(state === 'start'){
      if(images.startMsg){
        const img = images.startMsg;
        const SCALE = 0.6;
        const targetW = BASE_W * SCALE;
        const aspect = img.height / img.width;
        const targetH = targetW * aspect;
        const x = (BASE_W - targetW) / 2;
        const y = (BASE_H - targetH) / 2;
        ctx.drawImage(img, x, y, targetW, targetH);
      }
      return; // nie rysuj obiektów gry gdy jesteśmy na ekranie startu
    }

    // rurki (współrzędne logiczne)
    for(const p of pipes) p.draw(ctx);
    // podstawa (współrzędne logiczne)
    if(images.base) ctx.drawImage(images.base, 0, BASE_H - images.base.height);
    // ptak
    bird.draw(ctx);

    // wynik w gornym prawym rogu uzywajac spritow cyfer
    function drawNumber(n, rightX, topY){
      const s = String(n);
      let x = rightX;
      // iteruj cyfry od prawej do lewej aby wyrownac do prawej
      for(let i = s.length - 1; i >= 0; i--){
        const d = s[i];
        const img = images['num' + d];
        if(img){
          const w = img.width;
          const h = img.height;
          x -= w;
          ctx.drawImage(img, x, topY, w, h);
          x -= 2; // spacing
        } else {
          // jesli brak spritea
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.font = '28px sans-serif';
          const tw = ctx.measureText(d).width;
          x -= tw;
          ctx.strokeText(d, x, topY + 28);
          ctx.fillText(d, x, topY + 28);
          x -= 2;
        }
      }
    }
    drawNumber(score, BASE_W - 12, 6);
  }

  // glowna petla
  function loop(ts){
    if(!lastTime) lastTime = ts; const dt = ts - lastTime; lastTime = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  Promise.all(loaders).then(()=>{
    // start petli po zaladowaniu assetow
    const startEl = document.getElementById('startScreen'); if(startEl) startEl.classList.add('hidden');
    requestAnimationFrame(loop);
  });

})();
