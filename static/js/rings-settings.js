

  // ========================
  // Helpers
  // ========================
  function rand(min,max){ return min + Math.random()*(max-min); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }
  function hexToRgb(hex){ return [(hex>>16)&255,(hex>>8)&255,hex&255]; }
  function rgbToHex([r,g,b]){ return (Math.round(r)<<16) | (Math.round(g)<<8) | Math.round(b); }

  // ========================
  // Random-walk generator
  // ========================
  function makeWalker(start, min, max){
    return { value:start, target:start, min, max };
  }

  function updateWalker(w){
    let diff = w.target - w.value;
    if(Math.abs(diff) < 0.01){
      w.target = rand(w.min, w.max);
    }
    w.value += diff * 0.02;
    w.value = clamp(w.value, w.min, w.max);
    return w.value;
  }

  // ========================
  // Color walkers
  // ========================
  function makeColorWalker(baseHex, variance=20){
    const rgb = hexToRgb(baseHex);
    return rgb.map(c => makeWalker(clamp(c - variance, 0, 255), clamp(c - variance, 0, 255), clamp(c + variance, 0, 255)));
  }

  function updateColorWalker(walkers){
    return rgbToHex(walkers.map(updateWalker));
  }

  // ========================
  // Walkers setup
  // ========================
  const baseBg = 0xf4f4f4;
  const walkers = {
    backgroundColor: makeColorWalker(baseBg, 20),
    color: makeColorWalker(0xff8a23, 40),
    size: makeWalker(1,1,7),
    spacing: makeWalker(50,20,100),
    vibration: makeWalker(0.5,0,1),
    speed: makeWalker(1,0.1,3)
  };

  // Random backgroundAlpha at startup
  const backgroundAlpha = rand(0,1);

  // ========================
  // Initialize VANTA
  // ========================
  let vantaEffect = VANTA.RINGS({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    backgroundAlpha: backgroundAlpha,
    backgroundColor: updateColorWalker(walkers.backgroundColor),
    color: updateColorWalker(walkers.color),
    size: walkers.size.value,
    spacing: walkers.spacing.value,
    vibration: walkers.vibration.value,
    speed: walkers.speed.value
  });

  // ========================
  // Animation loop
  // ========================
  function animate(){
    vantaEffect.setOptions({
      backgroundColor: updateColorWalker(walkers.backgroundColor),
      color: updateColorWalker(walkers.color),
      size: updateWalker(walkers.size),
      spacing: updateWalker(walkers.spacing),
      vibration: updateWalker(walkers.vibration),
      speed: updateWalker(walkers.speed)
    });

    requestAnimationFrame(animate);
  }
  animate();

