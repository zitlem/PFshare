

  // ========================
  // Helpers
  // ========================
  function hexToRgb(hex){ return [(hex>>16)&255,(hex>>8)&255,hex&255]; }
  function rgbToHex([r,g,b]){ return (Math.round(r)<<16) | (Math.round(g)<<8) | Math.round(b); }
  function rand(min,max){ return min + Math.random()*(max-min); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }

  // ========================
  // Base color + drift
  // ========================
  const baseColor = hexToRgb(0xf4f4f4); // main cohesive palette
  const COLOR_VARIANCE = 30;

  function makeColor(){
    const init = baseColor.map(c => clamp(c + rand(-COLOR_VARIANCE,COLOR_VARIANCE),0,255));
    return { current:[...init], target:[...init] };
  }

  function pickNewColorTarget(c){
    c.target = baseColor.map(ch => clamp(ch + rand(-COLOR_VARIANCE,COLOR_VARIANCE),0,255));
  }

  const colors = {
    color1: makeColor(),
    color2: makeColor(),
    backgroundColor: makeColor()
  };

  for(let k in colors) pickNewColorTarget(colors[k]);

  // ========================
  // Numeric values with ranges
  // ========================
  function makeValue(start,min,max){ return { value:start,target:start,min,max }; }
  const values = {
    birdSize: makeValue(2.6,0.5,3),
    wingSpan: makeValue(25,10,40),
    speedLimit: makeValue(6,1,10),
    separation: makeValue(66,1,100),
    alignment: makeValue(42,1,100),
    cohesion: makeValue(60,1,100),
    quantity: makeValue(4,1,5),
    backgroundAlpha: makeValue(0.5,0.1,0.9)
  };

  function pickNewValueTarget(v){ v.target = rand(v.min,v.max); }
  for(let k in values) pickNewValueTarget(values[k]);

  // ========================
  // Initialize VANTA.BIRDS
  // ========================
  let vantaEffect = VANTA.BIRDS({
    el:"#vanta-bg",
    mouseControls:true,
    touchControls:true,
    gyroControls:false,
    scale:1,
    scaleMobile:1,
    colorMode: ["lerpGradient","lerp","random","cycle"][Math.floor(Math.random()*4)],
    color1: rgbToHex(colors.color1.current),
    color2: rgbToHex(colors.color2.current),
    backgroundColor: rgbToHex(colors.backgroundColor.current),
    birdSize: values.birdSize.value,
    wingSpan: values.wingSpan.value,
    speedLimit: values.speedLimit.value,
    separation: values.separation.value,
    alignment: values.alignment.value,
    cohesion: values.cohesion.value,
    quantity: values.quantity.value,
    backgroundAlpha: values.backgroundAlpha.value
  });

  // ========================
  // Update loop: random walk
  // ========================
  setInterval(()=>{
    // Colors drift
    for(let key in colors){
      let c = colors[key];
      c.current = c.current.map((ch,i)=>{
        let diff = c.target[i]-ch;
        if(Math.abs(diff)<1) pickNewColorTarget(c);
        return ch + diff*0.02;
      });
    }

    // Numeric values drift
    for(let key in values){
      let v = values[key];
      let diff = v.target - v.value;
      if(Math.abs(diff)<0.01) pickNewValueTarget(v);
      v.value += diff*0.02;
    }

    // Apply to VANTA
    vantaEffect.setOptions({
      color1: rgbToHex(colors.color1.current),
      color2: rgbToHex(colors.color2.current),
      backgroundColor: rgbToHex(colors.backgroundColor.current),
      birdSize: values.birdSize.value,
      wingSpan: values.wingSpan.value,
      speedLimit: values.speedLimit.value,
      separation: values.separation.value,
      alignment: values.alignment.value,
      cohesion: values.cohesion.value,
      quantity: values.quantity.value,
      backgroundAlpha: values.backgroundAlpha.value
    });
  },50);

