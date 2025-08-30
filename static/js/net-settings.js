  function rand(min,max){ return min + Math.random()*(max-min); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }
  function hexToRgb(hex){ return [(hex>>16)&255,(hex>>8)&255,hex&255]; }
  function rgbToHex([r,g,b]){ return (Math.round(r)<<16) | (Math.round(g)<<8) | Math.round(b); }

  function makeWalker(start,min,max){ return { value:start,target:start,min,max }; }
  function updateWalker(w){
    let diff = w.target - w.value;
    if(Math.abs(diff)<0.1) w.target = rand(w.min,w.max);
    w.value += diff*0.02;
    w.value = clamp(w.value,w.min,w.max);
    return w.value;
  }

  function makeColorWalker(baseHex,variance=20){
    const rgb = hexToRgb(baseHex);
    return rgb.map(c=>makeWalker(clamp(c-variance,0,255), clamp(c-variance,0,255), clamp(c+variance,0,255)));
  }
  function updateColorWalker(walkers){ return rgbToHex(walkers.map(updateWalker)); }

  // ========================
  // Setup
  // ========================
  const baseBg = 0xf4f4f4;
  const walkers = { backgroundColor: makeColorWalker(baseBg,10) };

  // Random-once parameters
  const points = Math.round(rand(2,20));
  const spacing = rand(14,20);
  const showDots = Math.random()<0.5;
  const lineColor = rand(0,0xffffff); // random line color once
  const maxDistance = makeWalker(rand(10,30),10,30);

  // ========================
  // Initialize VANTA.NET
  // ========================
  let vantaEffect = VANTA.NET({
    el:"#vanta-bg",
    mouseControls:true,
    touchControls:true,
    gyroControls:false,
    backgroundColor:updateColorWalker(walkers.backgroundColor),
    color: lineColor,
    points:points,
    spacing:spacing,
    showDots:showDots,
    maxDistance:maxDistance.value
  });

  // ========================
  // Animate
  // ========================
  function animate(){
    vantaEffect.setOptions({
      backgroundColor:updateColorWalker(walkers.backgroundColor),
      maxDistance:updateWalker(maxDistance)
    });
    requestAnimationFrame(animate);
  }
  animate();

