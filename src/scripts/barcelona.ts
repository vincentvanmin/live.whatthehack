/*
	Creates an animated background,
	controlled by the scroll position.
	The SVG file must match the definitions.
	Fallbacks to PNG without animations
	if SVG is not supported.

	Requires
		-chroma-js: handles colors
		-svg file

	Interesting read about color gradients:
	https://www.vis4.net/blog/2013/09/mastering-multi-hued-color-scales/
*/
declare var chroma:any;

class Util{
	/*
		Maps range value q from [a1, b1] to [a2, b2]
	*/
	static mapRange(a1, b1, a2, b2, q):number{
		return (q - a1) * (b2 - a2) / (b1 - a1) + a2;
	}


	/*
	* Loads a file asynchronously
	* if succesfull calls cb(),
	* else calls cberr()
	*/
	static loadFile(sURL, cb, cberr) {
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if (this.readyState !== 4) return;
			if (this.status === 200) {
				if(typeof cb != "function") return;
				cb(this);
			} else {
				if(typeof cberr != "function") return;
				cberr(this);
			}
			
		};
		oReq.onerror = function(){
			if(typeof cberr != "function") return;
			cberr(this);
		};
		oReq.open("GET", sURL, true);
		oReq.send(null);
	}
}

class Barcelona{
	containerId : string;
	sunColorInterp : any;
	skyColorInterp : any;
	sunDistance : number;
	stylesheet : CSSStyleSheet;
	private readonly _ssTitle : string = "bg";
	private readonly _sunStyleClass : string = ".st4";
	private readonly _sky1StyleClass : string = ".st0";
	private readonly _sky2StyleClass : string = ".st1";
	private readonly _sky3StyleClass : string = ".st2";
	private readonly _sky4StyleClass : string = ".st3";
	private readonly _sunId : string = "lluna";
	private readonly _skyId : string = "cel";
	private readonly _buttonId : string = "boto_2_";
	private readonly _registerUrl : string = "https://my.hackupc.com";
	private readonly _svgSunFileName : string = "assets/img/bg-revers-closed.svg";
	private readonly _svgGroundFileName : string = "assets/img/bg-frontal-closed.svg";
	private readonly _pngFileName : string = "assets/img/bg-fallback-closed.png";
	private readonly _phoneBgFileName : string = "assets/img/bg-fallback-bq-closed.png";
	private readonly _pngButtonRectMin : [number, number] = [557, 452]
	private readonly _pngButtonRectMax : [number, number] = [693, 490]
	private readonly _pngBaseRes : [number, number] = [1250, 1125]


	constructor(containerId : string, 
		sunColors : string[],
		skyColors : string[]){
		let self = this;
		this.containerId = containerId;
		if(this.isPhone())
		{
			this.loadBg(this._phoneBgFileName)
		}
		else if(this.isBrowserSVGCapable())
		{
			this.loadSVG(function(){
				self.sunColorInterp = chroma.bezier(sunColors);
				self.skyColorInterp = chroma.bezier(skyColors);
				self.setListener();
				self.getStyleSheet();
			});
		}
		else
		{
			this.loadBg(this._pngFileName)
		}
	};


	update = () => {
		var factor = Math.max(Math.min(window.scrollY / window.innerHeight, 1), 0);
		var bg = document.getElementById("background");
		bg.style.opacity = 1 * (1 - factor)+'';
		//bg.style.transform = "scale(" + (1 + factor) + ")";

		//Get normalized scroll position
		let scrollTop : number = window.scrollY;
		let q : number = Util.mapRange(
			//From
			//0, document.body.scrollHeight, 
			0, window.innerHeight/1.5, 
			//To
			0, 1, 
			//Input
			scrollTop
		);

		//Set interpolated sun color
		let sunColor : string = this.sunColorInterp(q).hex();
		this.setFillColor(this._sunStyleClass, sunColor);

		//Set interpolated sky color
		let mainSkyColor : any = this.skyColorInterp(q);
		this.setFillColor(this._sky1StyleClass, mainSkyColor.hex());
		this.setFillColor(this._sky2StyleClass, mainSkyColor.brighten(0.4).hex());
		this.setFillColor(this._sky3StyleClass, mainSkyColor.brighten(0.8).hex());
		this.setFillColor(this._sky4StyleClass, mainSkyColor.brighten(1.2).hex());
		//Apply also to page background
		document.getElementById("sky-extension").style.backgroundColor = mainSkyColor.hex();
		
	}

	isPhone() : boolean{
		return (window.innerWidth < 700);
	}
	/*
		Get a reference to the SVG's stylesheet
	*/
	getStyleSheet() : void{
		for(let i = 0; i < document.styleSheets.length; i++)
		{
			if(document.styleSheets[i].title == this._ssTitle)
			{
				this.stylesheet = <CSSStyleSheet>document.styleSheets[i];
				return;
			}
		}
	}

	/*
	 Changes the fill style for the class cls with color clr
	*/
	setFillColor(cls:string, clr:string) : void{
		for(let i = 0; i < this.stylesheet.cssRules.length; i++)
		{
			let rule = <CSSStyleRule>this.stylesheet.cssRules[i];
			if(rule.selectorText == cls)
			{
				rule.style.fill = clr;
			}
		}
	}
	setListener() : void{
		let self = this;
		document.addEventListener('scroll', this.update);
		/* ====Applications closed===
		document.getElementById(this._buttonId).addEventListener('click', function(){
			window.open(self._registerUrl);
		});
		*/
	}

	isBrowserSVGCapable() : boolean{
		return typeof SVGRect !== "undefined";
		//return false;
	}

	loadSVG(cb) : void{
		let self = this;
		let error = (id)=>{
			console.error("Error while loading background '"+id+"'");
		};

		let container = document.getElementById(self.containerId);
		Util.loadFile(this._svgSunFileName, (xhr)=>{
			var child1 = container.appendChild(xhr.responseXML.documentElement)
			child1.id = 'sun';
			Util.loadFile(this._svgGroundFileName, (xhr2)=>{
				var child2 = container.appendChild(xhr2.responseXML.documentElement)
				child2.id = 'ground';
				if(cb) cb()
			},()=>{error('ground')});
		},()=>{error('sun')});
	}

	loadBg(filename) : void{
		let img = new Image();
		img.src = filename;
		let self = this;
		document.getElementById(this.containerId)
			.appendChild(img)
			/* ====Applications closed===
			.addEventListener('click', function(e){
				let scaleFactor = self._pngBaseRes[0] / img.width
				let clickBaseSpace : [number, number] = [
					e.offsetX*scaleFactor, 
					e.offsetY*scaleFactor
				]
				//Is outside defined rect?
				if(clickBaseSpace[0] < self._pngButtonRectMin[0]
					|| clickBaseSpace[1] < self._pngButtonRectMin[1]
					|| clickBaseSpace[0] > self._pngButtonRectMax[0]
					|| clickBaseSpace[1] > self._pngButtonRectMax[1])
					return;
				//Its inside!
				window.open(self._registerUrl)
			});
			*/
	}


}

document.addEventListener("DOMContentLoaded", function(){
	var factor = Math.max(Math.min(window.scrollY / window.innerHeight, 1), 0);
	var bg = document.getElementById("background");
	bg.style.opacity = 1 * (1 - factor)+'';

	let b = new Barcelona(
		'background',
		//Sun colors
		['#e22b57', '#e22b7b'],
		//Sky colors rgb(146, 60, 66)'#e22b7b', 
		['#0E8C99', '#e22b7b', '#e22b7b'],
	);
});