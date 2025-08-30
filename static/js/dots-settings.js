

  // ========================
  // Helpers
  // ========================
  function hexToRgb(hex){ return [(hex>>16)&255,(hex>>8)&255,hex&255]; }
  function rgbToHex([r,g,b]){ return (Math.round(r)<<16) | (Math.round(g)<<8) | Math.round(b); }
  function rand(min,max){ return min + Math.random()*(max-min); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }

  // ========================
  // Random-walk value generator
  // ========================
  function makeWalker(start, min, max, step=0.5){
    return {
      value:start,
      target:start,
      min, max, step
    };
  }
  function updateWalker(w){
    let diff = w.target - w.value;
    if(Math.abs(diff) < 0.01){
      w.target = rand(w.min, w.max); // pick new target
    }
    w.value += diff * 0.02; // smooth drift
    return w.value;
  }

  // ========================
  // Color walkers
  // ========================
  function makeColorWalker(baseHex, variance=20){
    const rgb = hexToRgb(baseHex);
    return rgb.map(c => makeWalker(c, clamp(c-variance,0,255), clamp(c+variance,0,255)));
  }
  function updateColorWalker(walkers){
    return rgbToHex(walkers.map(updateWalker));
  }

  // ========================
  // Setup ranges
  // ========================
  const walkers = {
    size: makeWalker(rand(1,7),1,7),
    spacing: makeWalker(rand(20,100),20,100),
    color: makeColorWalker(0xff8a23,40),
    color2: makeColorWalker(0xfa8825,40),
    backgroundColor: makeColorWalker(0xd7d7d7,10)
  };

  // Random one-time boolean
  const showLines = Math.random() < 0.5;

  // ========================
  // Initialize VANTA
  // ========================
  let vantaEffect = VANTA.DOTS({
    el:"#vanta-bg",
    mouseControls:true,
    touchControls:true,
    gyroControls:false,
    showLines: showLines,
    size: walkers.size.value,
    spacing: walkers.spacing.value,
    color: updateColorWalker(walkers.color),
    color2: updateColorWalker(walkers.color2),
    backgroundColor: updateColorWalker(walkers.backgroundColor)
  });

  // ========================
  // Animation loop
  // ========================
  setInterval(()=>{
    vantaEffect.setOptions({
      size: updateWalker(walkers.size),
      spacing: updateWalker(walkers.spacing),
      color: updateColorWalker(walkers.color),
      color2: updateColorWalker(walkers.color2),
      backgroundColor: updateColorWalker(walkers.backgroundColor)
    });
  },50);

