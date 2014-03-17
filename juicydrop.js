/*
JuicyDrop - JavaScript/Canvas Music Visualization based on Winamp's MilkDrop plugin
By Jacob Seidelin, http://blog.nihilogic.dk/
*/

var JuicyDrop = (function() {

var max = Math.max;
var min = Math.min;
var _pow = Math.pow;
var pow = function(n, p) { var r = _pow(n, p); return isNaN(r) ? 0 : r; };
var sqr = function(n) { return n*n; };
var sqrt = Math.sqrt;
var sin = Math.sin;
var cos = Math.cos;
var atan2 = Math.atan2;
var tan = Math.tan;
var int = Math.floor;
var asin = Math.asin;
var atan = Math.atan;
var acos = Math.acos;
var log = Math.log;
var log10 = function(n) { return log(n) / log(10); };
var sign = function(n) { return n < 0 ? -1 : (n == 0 ? 0 : 1); };
var exp = Math.exp;
var int = Math.floor;
var abs = Math.abs;
var ternif = function(cond,val1,val2) { return cond ? val1 : val2; };
var bor = function(n1, n2) { return (n1 || n2) ? 1 : 0; };
var band = function(n1, n2) { return (n1 && n2) ? 1 : 0; };
var bnot = function(n1) { return n1 ? 0 : 1; };
// https://xbmc.svn.sourceforge.net/svnroot/xbmc/vendor/libprojectM/current/BuiltinFuncs.hpp
var R =  32767, RR = 65534;
var sigmoid = function(n1, n2) { return (RR / (1 + exp( -(n1 * n2) / R) - R)) };
var random = Math.random;
function rand(num) {
	return random() * num;
}
var equal = function(a,b) { return (a == b) ? 1 : 0; };
var above = function(a,b) { return (a > b) ? 1 : 0; };
var below = function(a,b) { return (a < b) ? 1 : 0; };
var PI = Math.PI;
var PI2 = Math.PI * 2;

var randStart = [];
randStart[0] = ((random()*0xffff) % 64841)*0.01;
randStart[1] = ((random()*0xffff) % 53751)*0.01;
randStart[2] = ((random()*0xffff) % 42661)*0.01;
randStart[3] = ((random()*0xffff) % 31571)*0.01;

var numFreqBands = 3;
var freqBandInterval = 256 / numFreqBands;

function xhr(url, callback, error, method) {
	var http = null;
	if (window.XMLHttpRequest) {
		http = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		http = new ActiveXObject("Microsoft.XMLHTTP");
	}
	if (http) {
		if (callback) {
			if (typeof(http.onload) != "undefined")
				http.onload = function() {
					callback(http);
					http = null;
				};
			else {
				http.onreadystatechange = function() {
					if (http.readyState == 4) {
						callback(http);
						http = null;
					}
				};
			}
		}
		http.open(method || "GET", url + "?time=" + new Date().getTime(), true);
		http.send(null);
	} else {
		if (error) error();
	}
}

// draws the basic waveform
function drawWave(soundData, ctx, settings, frameData, screenWidth, screenHeight, lineScale) {

	if (settings.color[3] < 0.001)
		return;

	// console.log(soundData, 'SOUNDDATA')
	var waveDataL = soundData.waveDataL.left.slice(0);
	var waveDataR = soundData.waveDataR.right.slice(0);

	var scale = settings.waveScale;
	waveDataL[0] *= scale;
	waveDataR[0] *= scale;
	var mix2 = settings.waveSmoothing;
	var mix1 = scale * (1.0 - mix2);
	for (var i=1;i<256;i++) {
		waveDataL[i] = waveDataL[i]*mix1 + waveDataL[i-1]*mix2;
		waveDataR[i] = waveDataR[i]*mix1 + waveDataR[i-1]*mix2;
	}

	var eqDataL = soundData.eqDataL;
	var eqDataR = soundData.eqDataR;
	var time = frameData.time;

	ctx.save();

	var canvas = ctx.canvas;
	var width = screenWidth;
	var height = screenHeight;

	var wavePosX = (settings.center.x*2-1);
	var wavePosY = (settings.center.y*2-1);

	ctx.translate(
		width*settings.center.x,
		height*settings.center.y
	);

	var r = settings.color[0];
	var g = settings.color[1];
	var b = settings.color[2];

	if (settings.maximizeColor) {
		if (r > g && r > b) {
			var scale = 1 / r;
		} else if (g > r && g > b) {
			var scale = 1 / g;
		} else {
			var scale = 1 / b;
		}
		r *= scale;
		g *= scale;
		b *= scale;
	}

	var waveSamples = 256 - 16;
	var waveMode = settings.waveMode;
	var waveParam = settings.waveParam;
	var numVerts = waveSamples;

	var aspect = width / height;

	var alpha = settings.color[3];


	var points = [];
	var nBreak = 0;

	var bass_rel = soundData.relFreqBands[0];
	var mid_rel = soundData.relFreqBands[1];
	var treb_rel = soundData.relFreqBands[2];

	if (settings.modAlphaByVolume)
		alpha *= ((bass_rel + mid_rel + treb_rel)*0.333 - settings.modAlphaStart) / (settings.modAlphaEnd - settings.modAlphaStart);

	switch (waveMode) {
		case 0:
			// circular wave
			numVerts /= 2;
			var sample_offset = (waveSamples - numVerts) / 2 * 0.5;
			var inv_nverts_minus_one = 1.0 / (numVerts-1);
			for (var i=0;i<numVerts;i++) {
				var ang = i * inv_nverts_minus_one * 6.28 + time * 0.2;
				var rad = 0.5 + 0.4 * waveDataR[i + sample_offset] + waveParam;
	
				if (i < numVerts/10) {
					var mix = i/(numVerts*0.1);
					var mix = 0.5 - 0.5 * cos(mix * 3.1416);
					var rad_2 = 0.5 + 0.4 * waveDataR[i + numVerts + sample_offset] + waveParam;
					rad = rad_2 * (1.0 - mix) + rad * (mix);
				}
				var x = cos(ang) * rad + wavePosX;
				var y = sin(ang) * rad + wavePosY;
	
				points.push([x,y]);
			}
			break;
		case 1:
			// x-y osc. that goes around in a spiral, in time
			alpha *= 1.25;
	
			numVerts /= 2;	
			for (i=0; i<numVerts; i++) {
				var rad = 0.53 + 0.43 * waveDataR[i] + waveParam;
				var ang = waveDataL[i + 16] * 1.57 + time * 2.3;
				var x = rad * cos(ang) + wavePosX;
				var y = rad * sin(ang) + wavePosY;
				points.push([x,y]);
			}
			break;
		case 2:
			// centered spiro (alpha constant)
			// aimed at not being so sound-responsive, but being very "nebula-like"
			// difference is that alpha is constant (and faint), and waves a scaled way up
			numVerts /= 2;	
			for (i=0; i<numVerts; i++) {
				points.push([
					waveDataR[i] + wavePosX,
					waveDataL[i+16] + wavePosY
				]);
			}
			break;
		case 3:
			// centered spiro (alpha tied to volume)
			// aimed at having a strong audio-visual tie-in
			// colors are always bright (no darks)
			alpha *= 1.3;
			alpha *= frameData.treb_rel*frameData.treb_rel;

			numVerts /= 2;	
			for (i=0; i<numVerts; i++) {
				var x = waveDataR[i] + wavePosX;
				var y = waveDataL[i+16] + wavePosY;
				points.push([x,y]);
			}
			break;
		case 4:
			// horizontal "script", left channel
			numVerts /= 2;
			var sample_offset = (waveSamples-numVerts)/2 * 0.5;
	
			var w1 = 0.45 + 0.5*(waveParam*0.5 + 0.5);		// 0.1 - 0.9
			var w2 = 1.0 - w1;
	
			var inv_numVerts = 1.0/numVerts;
	
			for (var i=0;i<numVerts;i++) {
				var x = (-1.0 + 2.0 * (i*inv_numVerts)) + waveDataR[i+12+sample_offset]*0.44;
				var y = waveDataL[i+sample_offset]*0.47;
				if (i>1) {
					x = x*w2 + w1*(points[i-1][0]*2.0 - points[i-2][0]);
					y = y*w2 + w1*(points[i-1][1]*2.0 - points[i-2][1]);
				}
				points.push([x + wavePosX, y + wavePosY]);
			}
			break;
		case 5:
			// weird explosive complex # thingy
			var cos_rot = cos(time*0.3);
			var sin_rot = sin(time*0.3);

			for (i=0; i<numVerts; i++) {
				var x0 = (waveDataR[i]*waveDataL[i+16] + waveDataL[i]*waveDataR[i+16]);
				var y0 = (waveDataR[i]*waveDataR[i] - waveDataL[i+16]*waveDataL[i+16]);
				var x = (x0*cos_rot - y0*sin_rot) + wavePosX;
				var y = (x0*sin_rot + y0*cos_rot) + wavePosY;
				points.push([x,y]);
			}
			break;
		case 6:
		case 7:
		case 8:
			// 6: angle-adjustable left channel, with temporal wave alignment;
			//   fWaveParam controls the angle at which it's drawn
			//	 fWavePosX slides the wave away from the center, transversely.
			//   fWavePosY does nothing
			//
			// 7: same, except there are two channels shown, and
			//   fWavePosY determines the separation distance.
			// 
			// 8: same as 6, except using the spectrum analyzer (UNFINISHED)
			// 

			numVerts /= 2;

			if (waveMode == 8)
				numVerts = 128;
			else
				var sample_offset = (waveSamples-numVerts) / 2;

			var ang = 1.57 * waveParam;	// from -PI/2 to PI/2
			var dx  = cos(ang);
			var dy  = sin(ang);

			var edge_x = []
			var edge_y = [];

			edge_x[0] = wavePosX * cos(ang + 1.57) - dx*3.0;
			edge_y[0] = wavePosX * sin(ang + 1.57) - dy*3.0;
			edge_x[1] = wavePosX * cos(ang + 1.57) + dx*3.0;
			edge_y[1] = wavePosX * sin(ang + 1.57) + dy*3.0;

			for (var i=0; i<2; i++) {
				// clip the point against 4 edges of screen
				// be a bit lenient (use +/-1.1 instead of +/-1.0) 
				//	 so the dual-wave doesn't end too soon, after the channels are moved apart
				for (var j=0; j<4; j++) {
					var t;
					var bClip = false;

					switch(j) {
						case 0:
							if (edge_x[i] > 1.1) {
								t = (1.1 - edge_x[1-i]) / (edge_x[i] - edge_x[1-i]);
								bClip = true;
							}
							break;
						case 1:
							if (edge_x[i] < -1.1) {
								t = (-1.1 - edge_x[1-i]) / (edge_x[i] - edge_x[1-i]);
								bClip = true;
							}
							break;
						case 2:
							if (edge_y[i] > 1.1) {
								t = (1.1 - edge_y[1-i]) / (edge_y[i] - edge_y[1-i]);
								bClip = true;
							}
							break;
						case 3:
							if (edge_y[i] < -1.1) {
								t = (-1.1 - edge_y[1-i]) / (edge_y[i] - edge_y[1-i]);
								bClip = true;
							}
							break;
					}
					if (bClip) {
						var dx = edge_x[i] - edge_x[1-i];
						var dy = edge_y[i] - edge_y[1-i];
						edge_x[i] = edge_x[1-i] + dx*t;
						edge_y[i] = edge_y[1-i] + dy*t;
					}
				}
			}

			dx = (edge_x[1] - edge_x[0]) / numVerts;
			dy = (edge_y[1] - edge_y[0]) / numVerts;
			var ang2 = atan2(dy,dx);
			var perp_dx = cos(ang2 + 1.57);
			var perp_dy = sin(ang2 + 1.57);

			if (waveMode == 6) {
				for (i=0; i<numVerts; i++) {
					points.push([
						edge_x[0] + dx*i + perp_dx*0.25*waveDataL[i + sample_offset],
						edge_y[0] + dy*i + perp_dy*0.25*waveDataL[i + sample_offset]
					]);
				}
			} else if (waveMode == 8) {
				for (i=0; i<numVerts; i++) {
					var f = 0.1*log(eqDataL[i*2] + eqDataL[i*2+1]);
					points.push([
						edge_x[0] + dx*i + perp_dx*f,
						edge_y[0] + dy*i + perp_dy*f
					]);
				}
			} else {
				var sep = pow(wavePosY*0.5 + 0.5, 2.0);
				for (i=0; i<numVerts; i++) {
					points.push([
						edge_x[0] + dx*i + perp_dx*(0.25*waveDataL[i + sample_offset] + sep),
						edge_y[0] + dy*i + perp_dy*(0.25*waveDataL[i + sample_offset] + sep)
					]);
				}
				for (i=0; i<numVerts; i++) {
					points.push([
						edge_x[0] + dx*i + perp_dx*(0.25*waveDataR[i + sample_offset] - sep),
						edge_y[0] + dy*i + perp_dy*(0.25*waveDataR[i + sample_offset] - sep)
					]);
				}
				nBreak = numVerts;
				numVerts *= 2;
			}
			break;
	}

	if (alpha < 0) alpha = 0;
	if (alpha > 1) alpha = 1;

	var color = "rgba(" + (r*255>>0) + "," + (g*255>>0) + "," + (b*255>>0) + "," + alpha + ")";

	if (settings.additive)
		ctx.globalCompositeOperation = "lighter";

	var widthHalf = width * 0.5;
	var heightHalf = height * 0.5;

	if (settings.drawAsDots) {
		ctx.fillStyle = color;
		var dotSize = settings.drawThick ? 2.5 : 1.5;

		for (i=0,j=points.length;i<j;i++) {
			var point = points[i];
			ctx.fillRect(
				point[0] * widthHalf, 
				-heightHalf + (1-point[1]) * heightHalf, 
				dotSize, dotSize
			);
		}
	} else {
		ctx.scale(1,-1);
		ctx.strokeStyle = color;
		ctx.lineWidth = (settings.drawThick ? 1.5 : 1) * lineScale;
		ctx.beginPath();
		for (i=0,j=points.length;i<j;i++) {
			var point = points[i];
			if (i==0 || i==nBreak)
				ctx.moveTo(point[0] * widthHalf, point[1] * heightHalf)
			else
				ctx.lineTo(point[0] * widthHalf, point[1] * heightHalf)
		}
		ctx.stroke();
	}
	ctx.restore();
}

// I hate parsing text files and I'm not very good at it.
function parseMilk(milkString) {
	var lines = milkString.split("\r\n");
	var presets = [];

	var numPresets = 0;
	for (var i=0;i<lines.length;i++) {
		if (lines[i].substring(0,7) == "[preset") {
			numPresets++;
			presets.push({lines:[]});
		} else {
			if (numPresets) {
				presets[numPresets-1].lines.push(lines[i]);
			}
		}
	}
	for (var i=0;i<presets.length;i++) {
		presets[i] = parseMilkPreset(presets[i].lines);
	}

	return presets[0];
}

function parseMilkPreset(presetLines) {
	var perFrameEqs = [];
	var perPixelEqs = [];

	function hasVariable(varname) {
		if (typeof variables[varname] != "undefined") 
			return true;
		return false;
	}

	function isVarName(varname) {
		return !varname.match(/[^a-z0-9_]/);
	}

	function addVariable(varname, value) {
		variables[varname] = eval(value);
	}

	function addPresetVariable(varname, value) {
		presetVariables.push([varname, value]);
	}
	var presetVariables = [];

	var customWaves = [];
	var customShapes = [];

	var variables = {
		fRating			: 1,
		fDecay			: 1,
		zoom 			: 1,
		fZoomExponent		: 1,
		fGammaAdj		: 1,
		fVideoEchoZoom		: 1,
		fVideoEchoAlpha		: 0,
		nVideoEchoOrientation	: 0,
		nWaveMode		: 0,
		fWaveAlpha		: 0,
		fWaveScale		: 1,
		fWaveSmoothing		: 0,
		fWaveParam		: 0,
		bAdditiveWaves		: 0,
		bWaveDots		: 0,
		bWaveThick		: 0,
		bModWaveAlphaByVolume	: 0,
		bMaximizeWaveColor	: 1,
		bTexWrap		: 0,
		bDarkenCenter		: 0,
		bRedBlueStereo		: 0,
		bBrighten		: 0,
		bDarken			: 0,
		bSolarize		: 0,
		bInvert			: 0,
		fModWaveAlphaStart	: 0,
		fModWaveAlphaEnd	: 0,
		fWarpAnimSpeed		: 1,
		fWarpScale		: 1,
		fShader			: 0,
		rot			: 0,
		cx			: 0.5,
		cy			: 0.5,
		dx			: 0,
		dy			: 0,
		warp			: 0,
		sx			: 1,
		sy			: 1,
		wave_r			: 0,
		wave_g			: 0,
		wave_b			: 0,
		wave_a			: 0,
		wave_x			: 0,
		wave_y			: 0,
		ob_size			: 1,
		ob_r			: 0,
		ob_g			: 0,
		ob_b			: 0,
		ob_a			: 0,
		ib_size			: 1,
		ib_r			: 0,
		ib_g			: 0,
		ib_b			: 0,
		ib_a			: 0,
		mv_dx			: 0, 
		mv_dy			: 0, 
		mv_l			: 0,
		mv_r			: 0,
		mv_g			: 0,
		mv_b			: 0,
		mv_a			: 0
	};

	for (var i=0;i<presetLines.length;i++) {
		var line = presetLines[i];

		if (line.substring(0,10) == "per_frame_") {
			var eqString = line.substring(line.indexOf("=")+1).replace(/\ /g, "");
			if (eqString != "") {
				perFrameEqs.push(eqString);
				var parts = eqString.split("=");
				if (isVarName(parts[0]) && !hasVariable(parts[0])) {
					addPresetVariable(parts[0],0);
				}
			}

		} else if (line.substring(0,10) == "per_pixel_") {
			var eqString = line.substring(line.indexOf("=")+1);
			perPixelEqs.push(eqString);

		} else if (line.substring(0,9) == "wavecode_") {
			var varString = line.substring(0, line.indexOf("="));
			var varParts = varString.split("_");
			var waveIdx = parseInt(varParts[1],10);
			if (!customWaves[waveIdx]) {
				customWaves[waveIdx] = { perPointEqs : [] };
			}
			varParts.shift();
			varParts.shift();
			var waveVar = varParts.join("_");
			customWaves[waveIdx][waveVar] = eval(line.substring(line.indexOf("=")+1));

		} else if (line.split("=")[0].match(/wave_[0-9]_per_point/)) {
			var varString = line.substring(0, line.indexOf("="));
			var varParts = varString.split("_");
			var waveIdx = parseInt(varParts[1],10);
			if (!customWaves[waveIdx]) {
				customWaves[waveIdx] = { perPointEqs : [] };
			}
			customWaves[waveIdx].perPointEqs.push(line.substring(line.indexOf("=")+1));

		} else if (line.substring(0,10) == "shapecode_") {
			var varString = line.substring(0, line.indexOf("="));
			var varParts = varString.split("_");
			var shapeIdx = parseInt(varParts[1],10);
			if (!customShapes[shapeIdx]) {
				customShapes[shapeIdx] = { perFrameEqs : [] };
			}
			varParts.shift();
			varParts.shift();
			var shapeVar = varParts.join("_");
			customShapes[shapeIdx][shapeVar] = eval(line.substring(line.indexOf("=")+1));

		} else if (line.split("=")[0].match(/shape_[0-9]_per_frame/)) {
			var varString = line.substring(0, line.indexOf("="));
			var varParts = varString.split("_");
			var shapeIdx = parseInt(varParts[1],10);
			if (!customShapes[shapeIdx]) {
				customShapes[shapeIdx] = { perFrameEqs : [] };
			}
			customShapes[shapeIdx].perFrameEqs.push(line.substring(line.indexOf("=")+1));
		} else if (line.split("=")[0].match(/wave_[0-9]_per_frame/)) {

		} else {
			var varName = line.substring(0,line.indexOf("="));
			var varVal = line.substring(line.indexOf("=")+1);
			if (varName && varVal)
				addVariable(varName,varVal);
		}
	}

	function makeFunctionString(eqs) {
		var fncString = "";
		for (var i=0;i<eqs.length;i++) {
			var eqString = eqs[i];
			if (eqString.indexOf("//") != -1) {
				eqString = eqString.substring(0,eqString.indexOf("//"));
			}
			eqString = eqString.replace(/\ /g, "");
			eqString = eqString.replace(/if\(/g, "ternif(");
			fncString += eqString + "";
		}
		return fncString;
	}

	var preset = function() {

		var bass, treb, mid, rad;
		var bass_att, treb_att, mid_att;
		var time, frame, volume, fps, progress;

		var initVars = {};

		var fRating, decay, zoom, zoomexp, wave_mode, wave_mystery, 
			wave_r, wave_g, wave_b, wave_a, wave_x, wave_y,
			ob_size, ob_r, ob_g, ob_b, ob_a,
			ib_size, ib_r, ib_g, ib_b, ib_a,
			sx, sy, cx, cy, dx, dy, warp,
			mv_dx, mv_dy, mv_l, mv_r, mv_g, mv_b, mv_a, mv_x, mv_y;

		var q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16,
			q16, q17, q18, q19, q20, q21, q22, q23, q24, q25, q26, q27, q28, q29, q30, q31, q32;
		var t1, t2, t3, t4, t5, t6, t7, t8, t9;

		// some variables found in some of the presets that wouldn't get declared otherwise
		var dx_r = 0, dy_r = 0, treble = 0, bass_thresh = 0, treb_thresh = 0, mid_thresh = 0, 
			thresh = 0, lbass = 0, lmid = 0, ltreb = 0, att = 0, xpos = 0, ypos = 0, x_pos = 0, y_pos = 0;
		var radical_dx = 0, radical_dy = 0, z = 0;

		for (var i=0;i<presetVariables.length;i++) {
			eval("var " + presetVariables[i][0] + " = " + presetVariables[i][1]);
		}

		var perFrameFnc = eval("(function() {" + makeFunctionString(perFrameEqs) + "})");

		var pixelVars = {};

		this.nextFrame = function(frameData) {
			// import frame variables
			bass = frameData.bass_rel;
			mid = frameData.mid_rel;
			treb = frameData.treb_rel;
			bass_att = frameData.bass_att;
			mid_att = frameData.mid_att;
			treb_att = frameData.treb_att;
			time = frameData.time;
			frame = frameData.frame;
			fps = frameData.fps;
			volume = (bass + mid + treb)*0.333;

			// reset vars
			zoom = variables.zoom;
			zoomexp = variables.fZoomExponent;
			rot = variables.rot;
			decay = variables.fDecay;
			wave_r = variables.wave_r;
			wave_g = variables.wave_g;
			wave_b = variables.wave_b;
			wave_a = variables.fWaveAlpha;
			wave_mode = variables.nWaveMode;
			wave_mystery = variables.fWaveParam;
			wave_dots = variables.bWaveDots;
			wave_thick = variables.bWaveThick;
			additive = variables.bAdditiveWaves;
			gamma = variables.fGammaAdj;
			sx = variables.sx;
			sy = variables.sy;
			cx = variables.cx;
			cy = variables.cy;
			dx = variables.dx;
			dy = variables.dy;
			warp = variables.warp;
			ob_size = variables.ob_size;
			ob_r = variables.ob_r;
			ob_g = variables.ob_g;
			ob_b = variables.ob_b;
			ob_a = variables.ob_a;
			ib_size = variables.ib_size;
			ib_r = variables.ib_r;
			ib_g = variables.ib_g;
			ib_b = variables.ib_b;
			ib_a = variables.ib_a;

			mv_x = variables.nMotionVectorsX;
			mv_y = variables.nMotionVectorsY;
			mv_r = variables.mv_r;
			mv_g = variables.mv_g;
			mv_b = variables.mv_b;
			mv_a = variables.mv_a;
			mv_dx = variables.mv_dx;
			mv_dy = variables.mv_dy;
			mv_l = variables.mv_l;

			// per_frame equations
			perFrameFnc();

			pixelVars = {
				zoom : zoom,
				zoomexp : zoomexp,
				rot : rot,
				cx : cx,
				cy : cy,
				sx : sx,
				sy : sy,
				dx : dx,
				dy : dy,
				warp : warp,
			};

			// export variables
			return {
				zoom : zoom,
				zoomexp : zoomexp,
				decay : decay,
				rot : rot,
				cx : cx,
				cy : cy,
				sx : sx,
				sy : sy,
				dx : dx,
				dy : dy,
				warp : warp,
				wave_mode : wave_mode,
				wave_mystery : wave_mystery,
				wave_r : wave_r,
				wave_g : wave_g,
				wave_b : wave_b,
				wave_a : wave_a,
				wave_dots : wave_dots,
				wave_thick : wave_thick,
				ob_size : ob_size,
				ob_r : ob_r,
				ob_g : ob_g,
				ob_b : ob_b,
				ob_a : ob_a,
				ib_size : ib_size,
				ib_r : ib_r,
				ib_g : ib_g,
				ib_b : ib_b,
				ib_a : ib_a,
				fVideoEchoZoom : variables.fVideoEchoZoom,
				fVideoEchoAlpha : variables.fVideoEchoAlpha,
				nVideoEchoOrientation : variables.nVideoEchoOrientation,
				bModWaveAlphaByVolume : variables.bModWaveAlphaByVolume,
				fModWaveAlphaStart : variables.fModWaveAlphaStart,
				fModWaveAlphaEnd : variables.fModWaveAlphaEnd,
				bMaximizeWaveColor : variables.bMaximizeWaveColor,
				fWaveSmoothing : variables.fWaveSmoothing,
				fWaveScale : variables.fWaveScale,
				fShader : variables.fShader,
				additive : additive,
				gamma : gamma,
				fWarpAnimSpeed : variables.fWarpAnimSpeed,
				fWarpScale : variables.fWarpScale,
				mv_x : mv_x,
				mv_y : mv_y,
				mv_dx : mv_dx,
				mv_dy : mv_dy,
				mv_r : mv_r,
				mv_g : mv_g,
				mv_b : mv_b,
				mv_a : mv_a,
				mv_l : mv_l
			};
		}

		for (var i=0;i<customWaves.length;i++) {
			if (!customWaves[i]) continue;

			(function() {
			var wave = customWaves[i];
	
			var r, g, b, a, x, y;
			var t1 = 0;
			var t2 = 0;
			var t3 = 0;
			var t4 = 0;
			var t5 = 0;
			var t6 = 0;
			var t7 = 0;
			var t8 = 0;
			var t9 = 0;

			var fnc = eval("(function(sample, value1, value2) {" + makeFunctionString(wave.perPointEqs) + "})");

			wave.perPoint = function(sample, value1, value2) {
				r = wave.r;
				g = wave.g;
				b = wave.b;
				a = wave.a;
				x = 0;
				y = 0;

				fnc(sample, value1, value2);
	
				return {
					r : r,
					g : g,
					b : b,
					a : a,
					x : x,
					y : y
				}
			}
			})();
		}

		for (var i=0;i<customShapes.length;i++) {
			if (!customShapes[i]) continue;

			(function() {
			var shape = customShapes[i];

			var r, g, b, a, x, y;
			var r2, g2, b2, a2;
			var border_red, border_green, border_blue, border_alpha;
			var additive, rad, ang, thickOutline, textured;
			var tex_ang, tex_zoom;
			
			var fnc = eval("(function() {" + makeFunctionString(shape.perFrameEqs) + "})");

			shape.perFrame = function() {
				r = shape.r;
				g = shape.g;
				b = shape.b;
				a = shape.a;
				r2 = shape.r2;
				g2 = shape.g2;
				b2 = shape.b2;
				a2 = shape.a2;
				x = shape.x;
				y = shape.y;
				sides = shape.sides;
				additive = shape.additive;
				thickOutline = shape.thickOutline;
				textured = shape.textured;
				rad = shape.rad;
				ang = shape.ang;
				tex_ang = shape.tex_ang;
				tex_zoom = shape.tex_zoom;
				border_red = shape.border_r;
				border_green = shape.border_g;
				border_blue = shape.border_b;
				border_alpha = shape.border_a;

				fnc();
	
				return {
					r : r,
					g : g,
					b : b,
					a : a,
					r2 : r2,
					g2 : g2,
					b2 : b2,
					a2 : a2,
					x : x,
					y : y,
					border_r : border_red,
					border_g : border_green,
					border_b : border_blue,
					border_a : border_alpha,
					ang : ang,
					rad : rad,
					additive : additive,
					sides : sides,
					thickOutline : thickOutline,
					textured : textured,
					tex_ang : tex_ang,
					tex_zoom : tex_zoom
				}
			}

			})();
		}



		var perPixelString = "";
		for (var i=0;i<perPixelEqs.length;i++) {
			var eqString = perPixelEqs[i].replace(/\ /g, "");
			if (eqString.substring(0,2) == "//")
				continue;
			eqString = eqString.replace(/if\(/g, "ternif(");
			perPixelString += eqString + "";
		}
		var perPixelFnc = eval("(function(rad, ang, x, y) {" + perPixelString + "})");

		this.perPixel = function(rad, ang, x, y, frameData) {
			// import frame variables
			bass = frameData.bass_rel;
			mid = frameData.mid_rel;
			treb = frameData.treb_rel;
			bass_att = frameData.bass_att;
			mid_att = frameData.mid_att;
			treb_att = frameData.treb_att;
			time = frameData.time;
			frame = frameData.frame;

			// reset vars
			/*
			sx = variables.sx;
			sy = variables.sy;
			cx = variables.cx;
			cy = variables.cy;
			dx = variables.dx;
			dy = variables.dy;
			zoomexp = variables.fZoomExponent;
			zoom = variables.zoom;
			rot = variables.rot;
			warp = variables.warp;
			*/

			sx = pixelVars.sx;
			sy = pixelVars.sy;
			cx = pixelVars.cx;
			cy = pixelVars.cy;
			dx = pixelVars.dx;
			dy = pixelVars.dy;
			zoomexp = pixelVars.zoomexp;
			zoom = pixelVars.zoom;
			rot = pixelVars.rot;
			warp = pixelVars.warp;

			// per_pixel equations
			perPixelFnc(rad, ang, x, y);

			// export variables
			return {
				zoom : zoom,
				zoomexp : zoomexp,
				rot : rot,
				sx : sx,
				sy : sy,
				cx : cx,
				cy : cy,
				dx : dx,
				dy : dy,
				warp : warp
			}
		}

		this.waves = customWaves;
		this.shapes = customShapes;

		this.vars = {};
	}
	return new preset();
}

function renderMeshTriangle(dstCtx, d0, d1, d2, srcCanvas, s0, s1, s2) {
	var sax = s1.x - s0.x;
	var say = s1.y - s0.y;
	var sbx = s2.x - s0.x;
	var sby = s2.y - s0.y;

	var dinv = 1 / (sax * sby - say * sbx);

	var i11 = sby * dinv;
	var i22 = sax * dinv;
	var i12 = -say * dinv;
	var i21 = -sbx * dinv;

	var dax = d1.x - d0.x;
	var day = d1.y - d0.y;
	var dbx = d2.x - d0.x;
	var dby = d2.y - d0.y;

	var m11 = i11 * dax + i12 * dbx;
	var m12 = i11 * day + i12 * dby;
	var m21 = i21 * dax + i22 * dbx;
	var m22 = i21 * day + i22 * dby;

	dstCtx.save();
	dstCtx.beginPath();
	dstCtx.moveTo(d0.x, d0.y);
	dstCtx.lineTo(d1.x, d1.y);
	dstCtx.lineTo(d2.x, d2.y);
	dstCtx.clip();

	dstCtx.transform(m11, m12, m21, m22,
		d0.x - (m11 * s0.x + m21 * s0.y),
		d0.y - (m12 * s0.x + m22 * s0.y)
	);
	dstCtx.drawImage(srcCanvas, 0, 0);
	dstCtx.restore();
}


function drawMotionVectors(ctx, preset, vars, settings) {
	if (vars.mv_a >= 0.001) {
		var x,y;

		var width = settings.width;
		var height = settings.height;
		var lineScale = settings.lineScale;

		var nX = (vars.mv_x)>>0;
		var nY = (vars.mv_y)>>0;
		var dx = vars.mv_x - nX;
		var dy = vars.mv_y - nY;
		if (nX > 64) { nX = 64; dx = 0; }
		if (nY > 48) { nY = 48; dy = 0; }


		if (nX > 0 && nY > 0) {

			var dx2 = vars.mv_dx;
			var dy2 = vars.mv_dy;

			var len_mult = vars.mv_l;
			if (dx < 0) dx = 0;
			if (dy < 0) dy = 0;
			if (dx > 1) dx = 1;
			if (dy > 1) dy = 1;

			var r = (vars.mv_r*255)>>0;
			var g = (vars.mv_g*255)>>0;
			var b = (vars.mv_b*255)>>0;
			var a = (vars.mv_a*255)>>0;

			ctx.save();

			ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
			ctx.lineWidth = 2 * lineScale;
			ctx.lineCap = "round";
			ctx.beginPath();

			for (y=0; y<nY; y++) {
				var fy = (y + 0.25)/(nY + dy + 0.25 - 1.0);

				// now move by offset
				fy -= dy2;

				if (fy > 0.0001 && fy < 0.9999) {

					for (x=0; x<nX; x++) {
						var fx = (x + 0.25)/(nX + dx + 0.25 - 1.0);

						// now move by offset
						fx += dx2;

						if (fx > 0.0001 && fx < 0.9999) {
							var vx = (fx * 2.0 - 1.0) * width;
							var vy = (fy * 2.0 - 1.0) * height;
							ctx.moveTo(vx, vy)
							ctx.lineTo(vx+1, vy)
						}
					}

				}
			}

			ctx.stroke();
			ctx.restore();
		}
	}
}


function render(ctx, copyCtx, pixelCtx, overlayCtx, settings, preset, soundData, fps) {
	var time = soundData.position / 1000;
	var bass_rel = soundData.relFreqBands[0];
	var mid_rel = soundData.relFreqBands[1];
	var treb_rel = soundData.relFreqBands[2];

	var frameData = {
		bass_rel : soundData.relFreqBands[0],
		mid_rel : soundData.relFreqBands[1],
		treb_rel : soundData.relFreqBands[2],
		bass_att : soundData.avgRelFreqBands[0],
		mid_att : soundData.avgRelFreqBands[1],
		treb_att : soundData.avgRelFreqBands[2],
		time : time,
		frame : soundData.frameCount,
		fps : fps
	}

	var vars = preset.nextFrame(frameData);

	var sx = vars.sx;
	var sy = vars.sy;
	var dx = vars.dx;
	var dy = vars.dy;
	var cx = vars.cx;
	var cy = vars.cy;
	var zoom = vars.zoom;
	var rot = vars.rot;
	var decay = vars.decay;

	var width = settings.width;
	var height = settings.height;
	var lineScale = settings.lineScale;

	overlayCtx.clearRect(0,0,width,height);

	if (decay < 1) {
		ctx.globalCompositeOperation = "source-over";
		//var decay2 = decay*decay;
		ctx.fillStyle = "rgba(0,0,0," + (1 - decay) + ")";
		ctx.fillRect(0,0,width,height);
	}


	var screenCanvas = ctx.canvas;

	if (settings.drawCustomShapes)
		drawCustomShapes(ctx, preset, vars, settings);

	if (settings.drawCustomWaves)
		drawCustomWaves(ctx, preset, vars, settings, soundData, frameData);

	if (settings.drawWaveform) {
		var stdWave = {
			color : [vars.wave_r, vars.wave_g, vars.wave_b, vars.wave_a],
			additive : vars.additive,
			waveMode : vars.wave_mode>>0,
			waveParam : vars.wave_mystery,
			waveScale : vars.fWaveScale,
			waveSmoothing : vars.fWaveSmoothing,
			center : { x : cx, y : cy },
			maximizeColor : vars.bMaximizeWaveColor,
			drawAsDots : vars.wave_dots,
			drawThick : vars.wave_thick,
			modAlphaByVolume : vars.bModWaveAlphaByVolume,
			modAlphaStart : vars.fModWaveAlphaStart,
			modAlphaEnd : vars.fModWaveAlphaEnd,
			gamma : vars.gamma
		}

		drawWave(soundData, ctx, stdWave, frameData, width, height, lineScale)
	}

	if (settings.drawMotionVectors)
		drawMotionVectors(ctx, preset, vars, settings);

	if (settings.drawBorders)
		drawBorders(ctx, preset, vars, settings);

	if (settings.drawPerPixelEffects)
		drawPerPixelEffects(ctx, pixelCtx, overlayCtx, preset, vars, settings, frameData)

	if (settings.drawVideoEcho)
		drawVideoEcho(ctx, copyCtx, preset, vars, settings);
}

function drawCustomWaves(ctx, preset, vars, settings, soundData, frameData) {
	if (preset.waves.length == 0)
		return;

	var time = frameData.time;

	var shade = [
		[ 1.0, 1.0, 1.0 ],
		[ 1.0, 1.0, 1.0 ],
		[ 1.0, 1.0, 1.0 ],
		[ 1.0, 1.0, 1.0 ]  // for each vertex, then each comp.
	];

	var shaderAmount = vars.fShader;

	if (shaderAmount >= 0.001) {
		for (var i=0; i<4; i++) {
			shade[i][0] = 0.6 + 0.3*sin(time*30.0*0.0143 + 3 + i*21 + randStart[3]);
			shade[i][1] = 0.6 + 0.3*sin(time*30.0*0.0107 + 1 + i*13 + randStart[1]);
			shade[i][2] = 0.6 + 0.3*sin(time*30.0*0.0129 + 6 + i*9  + randStart[2]);

			var maxshade = ((shade[i][0] > shade[i][1]) ? shade[i][0] : shade[i][1]);
			if (shade[i][2] > maxshade) 
				maxshade = shade[i][2];
			for (var k=0; k<3; k++) {
				shade[i][k] /= maxshade;
				shade[i][k] = 0.5 + 0.5 * shade[i][k];
			}
			for (var k=0; k<3; k++) {
				shade[i][k] = shade[i][k]*(shaderAmount) + 1.0*(1.0 - shaderAmount);
			}
		}
	}

	var shade00 = shade[0][0], shade01 = shade[0][1], shade02 = shade[0][2];
	var shade10 = shade[1][0], shade11 = shade[1][1], shade12 = shade[1][2];
	var shade20 = shade[2][0], shade21 = shade[2][1], shade22 = shade[2][2];
	var shade30 = shade[3][0], shade31 = shade[3][1], shade32 = shade[3][2];

	ctx.save()

	var width = settings.width;
	var height = settings.height;
	var lineScale = settings.lineScale;

	//ctx.translate(width*0.5, height*0.5);
	//ctx.scale(1,-1);

	var waveDataL = soundData.waveDataL.left;
	var waveDataR = soundData.waveDataR.right;

	for (var i=0;i<preset.waves.length;i++) {
		var wave = preset.waves[i];
		if (!wave) continue;

		if (wave.enabled) {

			//float mult= (*pos)->scaling*presetOutputs->fWaveScale*( (*pos)->bSpectrum ? 0.015f :1.0f);

			var numSamples = (wave.samples / 4)>>0;
			numSamples = ((numSamples/16)>>0) * 16;
			if (numSamples < 16) numSamples = 16;

			var j_mult = 1.0/(numSamples-1); 

			var points = [];
			var firstr, firstg, firstb, firsta;
			var difColors = false;
			for (var s=0;s<numSamples;s++) {
				var p = points[s] = wave.perPoint(s*j_mult, waveDataL[s], waveDataR[s]);
				if (false && shaderAmount >= 0.001) {
					var x = p.x + 0.5;
					var y = p.y + 0.5;

					var x1 = 1 - x;
					var y1 = 1 - y;
					var r2 = (shade00 * x1 + shade10 * x) * y1 + (shade20 * x1 + shade30 * x) * y;
					var g2 = (shade01 * x1 + shade11 * x) * y1 + (shade21 * x1 + shade31 * x) * y;
					var b2 = (shade02 * x1 + shade12 * x) * y1 + (shade22 * x1 + shade32 * x) * y;

					if (r2 > 1) r2 = 1;
					if (g2 > 1) g2 = 1;
					if (b2 > 1) b2 = 1;

					p.r = (r2*255)>>0;
					p.g = (g2*255)>>0;
					p.b = (b2*255)>>0;
				} else {
					p.r = (p.r*255)>>0;
					p.g = (p.g*255)>>0;
					p.b = (p.b*255)>>0;
				}
				if (s==0) {
					firstr = p.r;
					firstg = p.g;
					firstb = p.b;
					firsta = p.a;
				}
				if (p.r != firstr || p.g != firstg || p.b != firstb || p.a != firsta)
					difColors = true;
			}


			if (wave.bAdditive) {
				ctx.globalCompositeOperation = "lighter";
			} else {
				ctx.globalCompositeOperation = "source-over";
			}

			if (wave.bUseDots) {
				var dotSize = (wave.bDrawThick ? 2.5 : 1.5) * lineScale;
				if (!difColors) {
					ctx.strokeStyle = "rgba(" + points[0].r + "," + points[0].g + "," + points[0].b + "," + points[0].a + ")";
					ctx.lineWidth = (wave.bDrawThick ? 2.5 : 1.5) * lineScale;
					ctx.beginPath();
				}

				for (p=0,j=points.length;p<j;p++) {
					var point = points[p];
					if (isNaN(point.x) || isNaN(point.y))
						continue;
					if (point.a >= 0.001) {
						if (difColors) {
							ctx.fillStyle = "rgba(" + point.r + "," + point.g + "," + point.b + "," + point.a + ")";
							ctx.fillRect(
								point.x * width, 
								point.y * height, 
								dotSize, dotSize
							);
						} else {
							var x = point.x * width;
							var y = point.y * height;
							ctx.moveTo(x, y);
							ctx.lineTo(x+1, y);
						}
					}
				}

				if (!difColors) {
					ctx.stroke();
				}

			} else {
				// Milkdrop paints each line segment with its own color. That's a lot of small paths to draw, so we'll
				// just split the entire path into 16 sub paths and render those with the color of the first point
				var pointsPerSubpath = 16;
				numSamples = ((numSamples/16)>>0)*16;
				var numSubpaths = numSamples / pointsPerSubpath;
				ctx.lineWidth = (wave.bDrawThick ? 1.5 : 0.7) * lineScale;
				for (var j=0;j<numSubpaths;j++) {
					ctx.beginPath();
					var po = j*pointsPerSubpath;
					var first = points[po];
					if (first.a >= 0.001) {
						ctx.strokeStyle = "rgba(" + first.r + "," + first.g + "," + first.b + "," + first.a + ")";
						for (p=0;p<pointsPerSubpath;p++) {
							var point = points[po+p];
							if (p==0)
								ctx.moveTo(point.x * width, point.y * height)
							else
								ctx.lineTo((point.x) * width, point.y * height)
						}
						ctx.stroke();
					}
				}
			}
		}
	}
	ctx.restore();
}

function drawCustomShapes(ctx, preset, vars, settings) {

	if (preset.shapes.length == 0)
		return;

	ctx.save();

	var width = settings.width;
	var height = settings.height;
	var lineScale = settings.lineScale;

	//ctx.scale(1,-1);

	for (var i=0;i<preset.shapes.length;i++) {
		var shape = preset.shapes[i];

		if (!shape) continue;

		if (shape.enabled) {

			var shapeVars = shape.perFrame();
			var sides = shapeVars.sides;

			if (sides > 50) {
				sides = (sides/4)>>0;
			}

			var points = [];
			points[0] = [(shapeVars.x), (shapeVars.y)];

			for (var j=1;j<sides+1;j++) {
				var t = (j-1)/sides;
				points[j] = [];
				points[j][0] = points[0][0] + shapeVars.rad * cos(t*3.1415927*2 + shapeVars.ang + 3.1415927*0.25);
				points[j][1] = points[0][1] + shapeVars.rad * sin(t*3.1415927*2 + shapeVars.ang + 3.1415927*0.25);
			}


			var r = ((shapeVars.r+shapeVars.r2)*0.5 * 255)>>0;
			var g = ((shapeVars.g+shapeVars.g2)*0.5 * 255)>>0;
			var b = ((shapeVars.b+shapeVars.b2)*0.5 * 255)>>0;
			var a = (shapeVars.a+shapeVars.a2)*0.5;

			/*
			var r = (shapeVars.r * 255)>>0;
			var g = (shapeVars.g * 255)>>0;
			var b = (shapeVars.b * 255)>>0;
			var a = shapeVars.a;
			*/

			var color = "rgba(" + r + "," + g + "," + b + "," + a + ")";

			if (shapeVars.additive)
				ctx.globalCompositeOperation = "lighter";
			else
				ctx.globalCompositeOperation = "source-over";

			ctx.beginPath();
			for (var p=1;p<points.length;p++) {
				var px = (points[p][0]) * width;
				var py = height - (points[p][1]) * height;
				if (p==1)
					ctx.moveTo(px, py);
				else
					ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.fillStyle = color;
			ctx.fill();

			if (shapeVars.border_a >= 0.001) {
				var br = (shapeVars.border_r * 255)>>0;
				var bg = (shapeVars.border_g * 255)>>0;
				var bb = (shapeVars.border_b * 255)>>0;
				var ba = shapeVars.border_a;
				var borderColor = "rgba(" + br + "," + bg + "," + bb + "," + ba + ")";
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = (shapeVars.thickOutline ? 1.5 : 1) * lineScale;
				ctx.stroke();
			}
		}
	}
	
	ctx.restore();
}

function drawBorders(ctx, preset, vars, settings) {
	var width = settings.width;
	var height = settings.height;

	if (vars.ob_size > 0 && vars.ob_a > 0) {
		var obr = (vars.ob_r*255)>>0;
		var obg = (vars.ob_g*255)>>0;
		var obb = (vars.ob_b*255)>>0;
		var size = vars.ob_size * 0.5;

		ctx.lineWidth = vars.ob_size * width;
		ctx.strokeStyle = "rgba(" + obr + "," + obg + "," + obb + "," + vars.ob_a + ")";
		ctx.strokeRect(0, 0, width, height);
	}

	if (vars.ib_size > 0 && vars.ib_a > 0) {
		var ibr = (vars.ib_r*255)>>0;
		var ibg = (vars.ib_g*255)>>0;
		var ibb = (vars.ib_b*255)>>0;
		var size = vars.ib_size * 0.5;
		var osize = vars.ob_size;

		ctx.strokeStyle = "rgba(" + ibr + "," + ibg + "," + ibb + "," + vars.ib_a + ")";
		ctx.lineWidth = vars.ib_size * width * 0.5;
		var iwidth = (1-osize)*width;
		var iheight = (1-osize)*height;
		ctx.strokeRect(
			osize*width*0.5 + size*width*0.5, osize*height*0.5 + size*height*0.5, 
			max(0, iwidth - size*width), max(0, iheight - size*height));
	}
}

function drawVideoEcho(ctx, copyCtx, preset, vars, settings) {
	if (vars.fVideoEchoAlpha > 0) {
		var width = settings.width;
		var height = settings.height;
		ctx.save();
		var orient = vars.nVideoEchoOrientation;
		switch (orient) {
			case 0: 
				break;
			case 1: 
				ctx.scale(-1,1);
				ctx.translate(-width,0);
				break;
			case 2: 
				ctx.scale(1,-1);
				ctx.translate(0,-height);
				break;
			case 3: 
				ctx.scale(-1,-1);
				ctx.translate(-width,-height);
				break;
		}
		var echoZoom = vars.fVideoEchoZoom;
		var difx = (echoZoom - 1) * width / 2;
		var dify = (echoZoom - 1) * height / 2;
		ctx.globalAlpha = vars.fVideoEchoAlpha;
		ctx.drawImage(ctx.canvas, 
			-difx, -dify, width*echoZoom, height*echoZoom
		);
		ctx.restore();
	}
}

function drawPerPixelEffects(ctx, pixelCtx, overlayCtx, preset, vars, settings, frameData) {
	var width = settings.width;
	var height = settings.height;
	var pixelMeshSizeX = settings.pixelMeshSizeX;
	var pixelMeshSizeY = settings.pixelMeshSizeY;
	var screenCanvas = ctx.canvas;

	var time = frameData.time;

	var mesh = [];
	var warpTime = time * vars.fWarpAnimSpeed;
	var warpScaleInv = 1.0 / vars.fWarpScale;

	var f = [
		11.68 + 4.0 * cos(warpTime*1.413 + 10),
		8.77 + 3.0 * cos(warpTime*1.113 + 7),
		10.54 + 3.0 * cos(warpTime*1.233 + 3),
		11.49 + 4.0 * cos(warpTime*0.933 + 5)
	];

	for (var x=0;x<=pixelMeshSizeX;x++) {
		mesh[x] = [];
		for (var y=0;y<=pixelMeshSizeY;y++) {
			var fx = x / pixelMeshSizeX;
			var fy = y / pixelMeshSizeY;

			var px = (fx - 0.5) * 2;
			var py = (fy - 0.5) * 2;

			//var dx2 = dx*2;
			//var dy2 = dy*2;

			//var rad = sqrt(dx2*dx2+dy2*dy2);
			var rad = sqrt(px*px+py*py);
			var ang = atan2(py,px);

			var pixelVars = preset.perPixel(rad, ang, fx, fy, frameData);

			//dx *= pixelVars.zoom * pixelVars.sx;
			//dy *= pixelVars.zoom * pixelVars.sy;

			var cx = pixelVars.cx;
			var cy = pixelVars.cy;
			var sx = pixelVars.sx;
			var sy = pixelVars.sy;
			var dx = pixelVars.dx;
			var dy = pixelVars.dy;
			var zoom = pixelVars.zoom;
			var rot = pixelVars.rot;

			var zoom2 = pow(zoom, pow(pixelVars.zoomexp, rad*2.0 - 1.0));
			//var zoom2inv = 1 / zoom2;
			var zoom2inv = zoom2;

			var u = px * 0.5 * zoom2inv + 0.5;
			var v = py * 0.5 * zoom2inv + 0.5;

			// stretch on X, Y:
			u = (u - cx)/sx + cx;
			v = (v - cy)/sy + cy;

			u += pixelVars.warp*0.0035 * sin(warpTime*0.333 + warpScaleInv * (dx * f[0] - dy * f[3]));
			v += pixelVars.warp*0.0035 * cos(warpTime*0.375 - warpScaleInv * (dx * f[2] + dy * f[1]));
			u += pixelVars.warp*0.0035 * cos(warpTime*0.753 - warpScaleInv * (dx * f[1] - dy * f[2]));
			v += pixelVars.warp*0.0035 * sin(warpTime*0.825 + warpScaleInv * (dx * f[0] + dy * f[3]));

			// rotation:
			var u2 = u - cx;
			var v2 = v - cy;

			var cos_rot = cos(rot);
			var sin_rot = sin(rot);
			u = u2*cos_rot - v2*sin_rot + cx;
			v = u2*sin_rot + v2*cos_rot + cy;

			// translation:
			u += dx;
			v += dy;

			mesh[x][y] = {
				x : (u) * width,
				y : (v) * height
			};
		}
	}

	var cellWidth = 1 / pixelMeshSizeX * width;
	var cellHeight = 1 / pixelMeshSizeY * height;

	for (var x=0;x<pixelMeshSizeX;x++) {
		var px = x / pixelMeshSizeX * width;
		for (var y=0;y<pixelMeshSizeY;y++) {
			var p00 = mesh[x][y];
			var p10 = mesh[x+1][y];
			var p01 = mesh[x][y+1];
			var p11 = mesh[x+1][y+1];

			var py = y / pixelMeshSizeY * height;

			var isIn00 = (p00.x > 0 || p00.x < 1 || p00.y > 0 || p00.y < 1);
			var isIn10 = (p10.x > 0 || p10.x < 1 || p10.y > 0 || p10.y < 1);
			var isIn01 = (p01.x > 0 || p01.x < 1 || p01.y > 0 || p01.y < 1);
			var isIn11 = (p11.x > 0 || p11.x < 1 || p11.y > 0 || p11.y < 1);

			if (isIn00 && isIn10 && isIn11) {
				renderMeshTriangle(
					pixelCtx,  
					p00, p10, p11, 
					screenCanvas,
					{ x : px, y : py },
					{ x : px+cellWidth, y : py },
					{ x : px+cellWidth, y : py+cellHeight }
				)
			}
			if (isIn00 && isIn01 && isIn11) {
				renderMeshTriangle(
					pixelCtx, 
					p00, p01, p11,
					screenCanvas,
					{ x : px, y : py },
					{ x : px, y : py+cellHeight },
					{ x : px+cellWidth, y : py+cellHeight }
				)
			}
		}
	}

	if (settings.drawMeshPoints) {
		overlayCtx.fillStyle = "green";
		for (var x=0;x<=pixelMeshSizeX;x++) {
			for (var y=0;y<=pixelMeshSizeY;y++) {
				var p = mesh[x][y];
				overlayCtx.fillRect(p.x - 2, p.y - 2, 4, 4);
			}
		}
	}

	ctx.clearRect(0,0,width,height);
	ctx.drawImage(pixelCtx.canvas, 0, 0);
}


function analyzeSound() {
	var juice = this.juice;

	// console.log(this.juice, 'this.juice')
	waveData = juice.waveData = this.waveformData;
	eqData = juice.eqData = this.eqData;
	peakData = juice.peakData = this.peakData;

	if (waveData.length == 512) {
		juice.waveDataL = waveData.slice(0, 256);
		juice.waveDataR = waveData.slice(256);
	} else {
		juice.waveDataL = juice.waveDataR = juice.waveData;
	}

	if (eqData.length == 512) {
		juice.eqDataL = eqData.slice(0, 256);
		juice.eqDataR = eqData.slice(256);
	} else {
		juice.eqDataL = juice.eqDataR = juice.eqData;
	}

	var juice = this.juice;
	var freqBands = juice.freqBands;
	var freqBands16 = juice.freqBands16;
	var avgFreqBands = juice.avgFreqBands;
	var longAvgFreqBands = juice.longAvgFreqBands;
	var relFreqBands = juice.relFreqBands;
	var avgRelFreqBands = juice.avgRelFreqBands;

	for (var i=0;i<numFreqBands;i++) {
		freqBands[i] = 0;
	}

	for (var i=0;i<128;i++) {
		freqBands[(i/freqBandInterval/2)>>0] += eqData[i];
	}

	for (var i=0;i<16;i++)
		freqBands16[i] = 0;
	for (var i=0;i<128;i++) {
		freqBands16[(i/8)>>0] += eqData[i];
	}

	juice.frameCount++;

	for (var i=0;i<numFreqBands;i++) {

		if (freqBands[i] > avgFreqBands[i])
			avgFreqBands[i] = avgFreqBands[i]*0.2 + freqBands[i]*0.8;
		else
			avgFreqBands[i] = avgFreqBands[i]*0.5 + freqBands[i]*0.5;

		if (juice.frameCount < 50)
			longAvgFreqBands[i] = longAvgFreqBands[i]*0.900 + freqBands[i]*0.100;
		else
			longAvgFreqBands[i] = longAvgFreqBands[i]*0.992 + freqBands[i]*0.008;

		if (abs(longAvgFreqBands[i]) < 0.001) {
			relFreqBands[i] = 1.0;
		} else {
			relFreqBands[i]  = freqBands[i] / longAvgFreqBands[i];
		}

		if (abs(longAvgFreqBands[i]) < 0.001) {
			avgRelFreqBands[i] = 1.0;
		} else {
			avgRelFreqBands[i]  = avgFreqBands[i] / longAvgFreqBands[i];
		}
	}

	juice.position = this.position;

}

var JuicyDrop = function(screenCtr, width, height, audioInput) {

	var screenWidth = 0;
	var screenHeight = 0;
	var music;

	var screen;

	var canvas = document.createElement("canvas");
	canvas.style.marginTop = "auto";
	canvas.style.marginBottom = "auto";
	var ctx = canvas.getContext("2d");

	var overlayCanvas = document.createElement("canvas");
	var overlayCtx = overlayCanvas.getContext("2d");

	canvas.style.position = overlayCanvas.style.position = "absolute";
	canvas.style.backgroundColor = "black";

	canvas.style.zIndex = 1;
	overlayCanvas.style.zIndex = 2;

	var copyCanvas = document.createElement("canvas");
	var copyCtx = copyCanvas.getContext("2d");

	var pixelCanvas = document.createElement("canvas");
	var pixelCtx = pixelCanvas.getContext("2d");

	var isChrome = (navigator.userAgent.toLowerCase().indexOf('chrome') > -1);

	var lineScale = 1;

	var renderSettings = {
		lineScale : 1,
		drawWaveform : true,
		drawCustomWaves : true,
		drawCustomShapes : true,
		drawBorders : true,
		drawPerPixelEffects : true,
		drawMotionVectors : true,
		drawVideoEcho : !isChrome,
		width : 0,
		height : 0,
		pixelMeshSizeX : 7,
		pixelMeshSizeY : 7,
		drawMeshPoints : false // for debugging

	};

	this.setScreen = function(screenEl) {

		if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
		if (overlayCanvas.parentNode) overlayCanvas.parentNode.removeChild(overlayCanvas);

		screenEl.appendChild(canvas);
		screenEl.appendChild(overlayCanvas);

		screen = screenEl;
	}

	this.getScreen = function() {
		return screen;
	}

	this.getCanvas = function() {
		return canvas;
	}

	this.getRenderSettings = function() {
		return renderSettings;
	}

	this.setAudioInput = function(audio) {
		if (music) {
			music.whileplaying = null;
		}
		// console.log(audio, 'audio')
		music = audio;

		music.juice = {
			frameCount : 0,
			volume : 0,
			freqBands : [],
			freqBands16 : [],
			avgFreqBands : [],
			relFreqBands : [],
			longAvgFreqBands : [],
			avgRelFreqBands : [],
			waveData : [],
			eqData : [],
			freqData : []
		};
		for (var i=0;i<numFreqBands;i++) {
			music.juice.avgFreqBands[i] = 0;
			music.juice.longAvgFreqBands[i] = 0;
		}
		music.whileplaying = analyzeSound;
	}

	this.getAudioInput = function() {
		return music;
	}

	this.setDimensions = function(w, h) {
		screenWidth = w;
		screenHeight = h;

		renderSettings.lineScale = sqrt(w*w+h*h) / sqrt(256*256+256*256);
		renderSettings.width = w;
		renderSettings.height = h;

		canvas.width = overlayCanvas.width = screenWidth;
		canvas.height = overlayCanvas.height = screenHeight;
		canvas.style.width = overlayCanvas.style.width = screenWidth + "px";
		canvas.style.height = overlayCanvas.style.height = screenHeight + "px";

		ctx.fillStyle = "black";
		ctx.fillRect(0,0,w,h);

		copyCanvas.width = screenWidth;
		copyCanvas.height = screenHeight;
		pixelCanvas.width = screenWidth;
		pixelCanvas.height = screenHeight;

	}

	this.setScreen(screenCtr);
	this.setDimensions(width, height);

	if (audioInput)
		this.setAudioInput(audioInput);

	var preset;
	var isMilkDrop = false;
	var presetUrl;

	this.loadMilkDrop = function(url, callback) {
		xhr(
			url, 
			function(http) {
				preset = parseMilk(http.responseText);
				console.log('preset', preset)
				isMilkDrop = true;
				presetUrl = url;
				if (callback)
					callback();
			}
		);
	}

	this.loadJuice = function(url, callback) {
	}

	this.reload = function(callback) {
		if (!preset) return;
		if (isMilkDrop) {
			this.loadMilkDrop(presetUrl, callback);
		} else {
			this.loadJuice(presetUrl, callback);
		}
	}


	var timer = 0;
	var targetFrameRate = 1000 / 30;
	var lastRenderTime = 0;
	var lastFrameCount = 0;
	var fps = 0;
	var frameHist = [];

	function renderCycle() {
		if (preset && music.juice.waveDataL && music.juice.frameCount != lastFrameCount) {
			var time = new Date().getTime();

			render(
				ctx, copyCtx, pixelCtx, overlayCtx, renderSettings,
				preset, music.juice, fps||1
			);
			lastFrameCount = music.juice.frameCount;

			var frameTime = new Date().getTime() - time;
			if (frameHist.length > 10)
				frameHist.shift();
			frameHist.push(frameTime);
			var totalFrameTime = 0;
			for (var i=0,j=frameHist.length;i<j;i++) {
				totalFrameTime += frameHist[i];
			}
			fps = 1000 * frameHist.length / totalFrameTime;

		}

		var now = new Date().getTime();
		var timeToNext = targetFrameRate;
		var lastFrameTime = now - lastRenderTime;
		if (lastFrameTime > targetFrameRate) {
			timeToNext = timeToNext - (lastFrameTime - targetFrameRate);
			if (timeToNext < 1) timeToNext = 1;
		}
		timer = setTimeout(renderCycle, timeToNext);


		// try to adjust quality a bit if needed
		if (fps < 5) {
			renderSettings.pixelMeshSizeX = 3;
			renderSettings.pixelMeshSizeY = 3;
		} else if (fps < 10) {
			renderSettings.pixelMeshSizeX = 5;
			renderSettings.pixelMeshSizeY = 5;
		} else {
			renderSettings.pixelMeshSizeX = 7;
			renderSettings.pixelMeshSizeY = 7;
		}
	}

	var isRendering = false;

	this.start = function() {
		rendering = true;
		renderCycle();
	}

	this.stop = function() {
		if (timer)
			clearTimeout(timer);
		timer = 0;
		isRendering = false;
	}

	this.isRunning = function() {
		return isRendering;
	}

	var debugMode = false;
	this.toggleDebug = function(debug) {
		if (!debugMode) {
			debugMode = true;
			renderSettings.drawMeshPoints = true;
		} else {
			debugMode = false;
			renderSettings.drawMeshPoints = false;
		}
	}

}

// helper function for setting the relevant SM2 settings needed for JuicyDrop to work
JuicyDrop.prepareSM2 = function(soundManager) {
	soundManager.flashVersion = 9;
	soundManager.preferFlash = true;
	soundManager.allowScriptAccess = 'always';
	soundManager.flash9Options.useEQData = true;
	soundManager.flash9Options.useWaveformData = true;
	soundManager.useHighPerformance = true;
	soundManager.allowPolling = false;
	soundManager.defaultOptions.whileplaying = analyzeSound;
	soundManager.useHTML5Audio = true,
	soundManager.waitForWindowLoad = false,
	soundManager.wmode = null
}

return JuicyDrop;

})();



