

  // ========================
  // Helpers
  // ========================
  function hexToRgb(hex) { return [(hex>>16)&255, (hex>>8)&255, hex&255]; }
  function rgbToHex([r,g,b]) { return (Math.round(r)<<16) | (Math.round(g)<<8) | Math.round(b); }
  function rand(min,max) { return min + Math.random()*(max-min); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }

  // ========================
  // Base color + drift
  // ========================
  const baseColor = hexToRgb(0x669ec0); // main wave color
  const COLOR_VARIANCE = 50;

  function makeColor(){
    const init = baseColor.map(c=>clamp(c+rand(-COLOR_VARIANCE,COLOR_VARIANCE),0,255));
    return { current:[...init], target:[...init] };
  }

  function pickNewColorTarget(c){
    c.target = baseColor.map(ch=>clamp(ch+rand(-COLOR_VARIANCE,COLOR_VARIANCE),0,255));
  }

  const colorObj = makeColor();
  pickNewColorTarget(colorObj);

  // ========================
  // Numeric values with ranges
  // ========================
  function makeValue(start,min,max){ return { value:start,target:start,min,max }; }
  const values = {
    shininess: makeValue(99,0,150),
    waveHeight: makeValue(33.5,0,40),
    waveSpeed: makeValue(0.6,0,2),
    zoom: makeValue(1.69,0.7,1.8)
  };

  function pickNewValueTarget(v){ v.target = rand(v.min,v.max); }
  for(let k in values) pickNewValueTarget(values[k]);

  // ========================
  // Initialize VANTA.WAVES
  // ========================
  let vantaEffect = VANTA.WAVES({
    el:"#vanta-bg",
    mouseControls:true,
    touchControls:true,
    gyroControls:false,
    scale:1,
    scaleMobile:1,
    color: rgbToHex(colorObj.current),
    shininess: values.shininess.value,
    waveHeight: values.waveHeight.value,
    waveSpeed: values.waveSpeed.value,
    zoom: values.zoom.value
  });

  // ========================
  // Update loop: random walk
  // ========================
  setInterval(()=>{
    // Color drift
    colorObj.current = colorObj.current.map((ch,i)=>{
      let diff = colorObj.target[i]-ch;
      if(Math.abs(diff)<1) pickNewColorTarget(colorObj);
      return ch + diff*0.02;
    });

    // Numeric drift
    for(let k in values){
      let v = values[k];
      let diff = v.target - v.value;
      if(Math.abs(diff)<0.01) pickNewValueTarget(v);
      v.value += diff*0.02;
    }

    // Apply to VANTA
    vantaEffect.setOptions({
      color: rgbToHex(colorObj.current),
      shininess: values.shininess.value,
      waveHeight: values.waveHeight.value,
      waveSpeed: values.waveSpeed.value,
      zoom: values.zoom.value
    });
  },50);

