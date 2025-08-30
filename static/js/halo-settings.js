

  // ========================
  // Helpers
  // ========================
  function rand(min,max){ return min + Math.random()*(max-min); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }
  function hexToRgb(hex){ return [(hex>>16)&255,(hex>>8)&255,hex&255]; }
  function rgbToHex([r,g,b]){ return (Math.round(r)<<16) | (Math.round(g)<<8) | Math.round(b); }

  function makeWalker(start,min,max){ return { value:start,target:start,min,max }; }
  function updateWalker(w){
    let diff = w.target - w.value;
    if(Math.abs(diff)<0.001) w.target = rand(w.min,w.max);
    w.value += diff*0.02;
    w.value = clamp(w.value,w.min,w.max);
    return w.value;
  }

  function makeColorWalker(baseHex,variance=50){
    const rgb = hexToRgb(baseHex);
    return rgb.map(c=>makeWalker(clamp(c-variance,0,255), clamp(c-variance,0,255), clamp(c+variance,0,255)));
  }
  function updateColorWalker(walkers){ return rgbToHex(walkers.map(updateWalker)); }

  // ========================
  // Walkers
  // ========================
  const walkers = {
    backgroundColor: makeColorWalker(0xf4f4f4, 30), // slight drift around base
    baseColor: makeColorWalker(0xff8a23, 255)       // full range
  };

  const values = {
    size: makeWalker(1, 0.1, 3),
    amplitudeFactor: makeWalker(1, 0.1, 3),
    xOffset: makeWalker(0, -0.5, 0.5),
    yOffset: makeWalker(0, -0.5, 0.5)
  };

  // ========================
  // Initialize VANTA.HALO
  // ========================
  let vantaEffect = VANTA.HALO({
    el:"#vanta-bg",
    mouseControls:true,
    touchControls:true,
    gyroControls:false,
    backgroundColor:updateColorWalker(walkers.backgroundColor),
    baseColor:updateColorWalker(walkers.baseColor),
    size:values.size.value,
    amplitudeFactor:values.amplitudeFactor.value,
    xOffset:values.xOffset.value,
    yOffset:values.yOffset.value
  });

  // ========================
  // Animate loop
  // ========================
  function animate(){
    vantaEffect.setOptions({
      backgroundColor:updateColorWalker(walkers.backgroundColor),
      baseColor:updateColorWalker(walkers.baseColor),
      size:updateWalker(values.size),
      amplitudeFactor:updateWalker(values.amplitudeFactor),
      xOffset:updateWalker(values.xOffset),
      yOffset:updateWalker(values.yOffset)
    });
    requestAnimationFrame(animate);
  }
  animate();

