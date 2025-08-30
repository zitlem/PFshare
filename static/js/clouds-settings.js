

  // ========================
  // Helpers
  // ========================
  function hexToRgb(hex){ return [(hex>>16)&255,(hex>>8)&255,hex&255]; }
  function rgbToHex([r,g,b]){ return (Math.round(r)<<16) | (Math.round(g)<<8) | Math.round(b); }
  function rand(min,max){ return min + Math.random()*(max-min); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }

  // ========================
  // Base colors
  // ========================
  const baseColors = {
    backgroundColor: 0xfffdfd,
    skyColor: 0x87c7e1,
    cloudColor: 0xa4bbdc,
    cloudShadowColor: 0x1b3e61,
    sunColor: 0xf79820,
    sunGlareColor: 0xeb5f31,
    sunlightColor: 0xff9b37
  };

  const VARIANCE = 15; // max offset per RGB channel

  function randomizeColor(baseHex){
    const rgb = hexToRgb(baseHex);
    return rgbToHex(rgb.map(c => clamp(c + rand(-VARIANCE, VARIANCE), 0, 255)));
  }

  const colors = {};
  for(let key in baseColors){
    colors[key] = randomizeColor(baseColors[key]);
  }

  // ========================
  // Random speed (single value)
  // ========================
  const speed = rand(0,3.5);

  // ========================
  // Initialize VANTA.CLOUDS
  // ========================
  let vantaEffect = VANTA.CLOUDS({
    el:"#vanta-bg",
    mouseControls:true,
    touchControls:true,
    gyroControls:false,
    minHeight:200,
    minWidth:200,
    backgroundColor: colors.backgroundColor,
    skyColor: colors.skyColor,
    cloudColor: colors.cloudColor,
    cloudShadowColor: colors.cloudShadowColor,
    sunColor: colors.sunColor,
    sunGlareColor: colors.sunGlareColor,
    sunlightColor: colors.sunlightColor,
    speed: speed
  });

