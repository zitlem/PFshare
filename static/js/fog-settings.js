  function hexToRgb(hex) {
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  }
  function rgbToHex([r, g, b]) {
    return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
  }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // Base color
  const baseColor = hexToRgb(0xf4f4f4);

  // Maximum variation for initial randomization
  const INITIAL_VARIANCE = 20;
  const DRIFT_VARIANCE = 30;

  // Generate initial color within range of base
  function randomInitColor() {
    return baseColor.map(c => clamp(c + rand(-INITIAL_VARIANCE, INITIAL_VARIANCE), 0, 255));
  }

  // Create color object
  function makeColor() {
    const init = randomInitColor();
    return { current: [...init], target: [...init] };
  }

  // Initialize colors
  let colors = {
    highlightColor: makeColor(),
    midtoneColor: makeColor(),
    lowlightColor: makeColor(),
    baseColor: makeColor()
  };

  function pickNewTargetColor(c) {
    c.target = baseColor.map(ch => clamp(ch + rand(-DRIFT_VARIANCE, DRIFT_VARIANCE), 0, 255));
  }

  // Numeric values
  function makeValue(start, min, max) { return { value: start, target: start, min, max }; }
  let values = {
    blurFactor: makeValue(0.3, 0.3, 0.9),
    speed: makeValue(0.7, 0.7, 3.0),
    zoom: makeValue(0.3, 0.1, 1.5)
  };

  function pickNewValueTarget(v) { v.target = rand(v.min, v.max); }

  // Initialize targets
  for (let k in colors) pickNewTargetColor(colors[k]);
  for (let k in values) pickNewValueTarget(values[k]);

  // Initialize VANTA
  let vantaEffect = VANTA.FOG({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    highlightColor: rgbToHex(colors.highlightColor.current),
    midtoneColor: rgbToHex(colors.midtoneColor.current),
    lowlightColor: rgbToHex(colors.lowlightColor.current),
    baseColor: rgbToHex(colors.baseColor.current),
    blurFactor: values.blurFactor.value,
    speed: values.speed.value,
    zoom: values.zoom.value
  });

  // Update loop (random walk)
  setInterval(() => {
    // Colors drift
    for (let key in colors) {
      let c = colors[key];
      c.current = c.current.map((ch, i) => {
        let diff = c.target[i] - ch;
        if (Math.abs(diff) < 1) pickNewTargetColor(c);
        return ch + diff * 0.02;
      });
    }

    // Values drift
    for (let key in values) {
      let v = values[key];
      let diff = v.target - v.value;
      if (Math.abs(diff) < 0.005) pickNewValueTarget(v);
      v.value += diff * 0.02;
    }

    // Apply to VANTA
    vantaEffect.setOptions({
      highlightColor: rgbToHex(colors.highlightColor.current),
      midtoneColor: rgbToHex(colors.midtoneColor.current),
      lowlightColor: rgbToHex(colors.lowlightColor.current),
      baseColor: rgbToHex(colors.baseColor.current),
      blurFactor: values.blurFactor.value,
      speed: values.speed.value,
      zoom: values.zoom.value
    });
  }, 50);

	