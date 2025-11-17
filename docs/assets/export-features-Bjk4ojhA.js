var $=Object.defineProperty;var T=(a,t,o)=>t in a?$(a,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):a[t]=o;var m=(a,t,o)=>T(a,typeof t!="symbol"?t+"":t,o);const L="html2canvas",P="jspdf";let h=null;const v="Unable to load PDF export tools. Please reinstall dependencies and try again.",y=new Error(v);async function C(){const a=await import(L),t=(a==null?void 0:a.default)??a;if(typeof t!="function")throw y;return t}async function z(){const a=await import(P),t=(a==null?void 0:a.jsPDF)??(a==null?void 0:a.default)??a;if(typeof t!="function")throw y;return t}async function x(){return h||(h=Promise.all([C(),z()]).then(([a,t])=>({html2canvas:a,jsPDF:t})).catch(a=>{throw h=null,a})),h}class E{static async exportBrandRider(t,o={}){const e={...this.DEFAULT_OPTIONS,...o},i=this.generateBrandRiderHTML(t);return this.generatePDF(i,{...e,filename:e.filename||`${t.title.toLowerCase().replace(/\s+/g,"-")}-brand-rider.pdf`})}static async exportCV(t,o={}){const e={...this.DEFAULT_OPTIONS,...o},i=this.generateCVHTML(t);return this.generatePDF(i,{...e,filename:e.filename||`${t.name.toLowerCase().replace(/\s+/g,"-")}-cv.pdf`})}static async exportHTML(t,o={}){const e={...this.DEFAULT_OPTIONS,...o};return this.generatePDF(t,e)}static async generatePDF(t,o){try{console.log("Loading PDF export tools...");const{jsPDF:e}=await x();console.log("PDF tools loaded successfully");const i=document.createElement("div");i.innerHTML=t,i.style.position="absolute",i.style.left="-9999px",i.style.top="-9999px",i.style.width="210mm",i.style.backgroundColor="white",i.style.fontFamily="Arial, sans-serif",i.style.fontSize="12px",i.style.lineHeight="1.4",i.style.color="#000000",document.body.appendChild(i);try{const n=new e({orientation:o.orientation,unit:"mm",format:o.format}),s=n.internal.pageSize.getWidth(),c=n.internal.pageSize.getHeight(),g=s-o.margins.left-o.margins.right,p=c-o.margins.top-o.margins.bottom;await this.addHTMLToPDF(n,i,{x:o.margins.left,y:o.margins.top,width:g,height:p});const r=n.output("blob"),l=URL.createObjectURL(r);return console.log("PDF generated successfully"),{blob:r,url:l,filename:o.filename}}finally{document.body.removeChild(i)}}catch(e){throw console.error("PDF export error details:",e),new Error(`PDF export failed: ${e instanceof Error?e.message:"Unknown error"}`)}}static async addHTMLToPDF(t,o,e){const i=this.extractTextContent(o);let n=e.y;const s=6,c=e.width;for(const g of i){n+s>e.y+e.height&&(t.addPage(),n=e.y),g.type==="heading"?(t.setFontSize(16),t.setFont(void 0,"bold")):g.type==="subheading"?(t.setFontSize(14),t.setFont(void 0,"bold")):(t.setFontSize(12),t.setFont(void 0,"normal"));const p=t.splitTextToSize(g.text,c);for(const r of p)n+s>e.y+e.height&&(t.addPage(),n=e.y),t.text(r,e.x,n),n+=s;(g.type==="heading"||g.type==="subheading")&&(n+=3)}}static extractTextContent(t){const o=[],e=i=>{var n,s,c,g;if(i.nodeType===Node.TEXT_NODE){const p=(n=i.textContent)==null?void 0:n.trim();p&&o.push({text:p,type:"text"})}else if(i.nodeType===Node.ELEMENT_NODE){const p=i,r=p.tagName.toLowerCase();if(r==="h1"){const l=(s=p.textContent)==null?void 0:s.trim();l&&o.push({text:l,type:"heading"})}else if(r==="h2"||r==="h3"){const l=(c=p.textContent)==null?void 0:c.trim();l&&o.push({text:l,type:"subheading"})}else if(r==="p"||r==="div"){const l=(g=p.textContent)==null?void 0:g.trim();l&&o.push({text:l,type:"text"})}else if(r==="ul"||r==="ol")p.querySelectorAll("li").forEach((u,b)=>{var f;const d=(f=u.textContent)==null?void 0:f.trim();if(d){const w=r==="ul"?"• ":`${b+1}. `;o.push({text:w+d,type:"text"})}});else for(const l of i.childNodes)e(l)}};return e(t),o}static generateBrandRiderHTML(t){const o=t.palette.map(e=>`<span style="display: inline-block; width: 20px; height: 20px; background-color: ${e.hex}; margin-right: 8px; border: 1px solid #ccc;"></span>${e.name} (${e.hex})`).join("<br>");return`
      <div style="max-width: 210mm; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">${t.title}</h1>
        <p style="font-size: 16px; font-style: italic; margin-bottom: 20px; color: #666;">${t.tagline}</p>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Voice & Tone</h2>
        <p style="margin-bottom: 15px;">${t.voiceTone.join(", ")}</p>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Signature Phrases</h2>
        <ul style="margin-bottom: 15px;">
          ${t.signaturePhrases.map(e=>`<li style="margin-bottom: 5px;">"${e}"</li>`).join("")}
        </ul>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Strengths</h2>
        <ul style="margin-bottom: 15px;">
          ${t.strengths.map(e=>`<li style="margin-bottom: 5px;">${e}</li>`).join("")}
        </ul>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Areas for Growth</h2>
        <ul style="margin-bottom: 15px;">
          ${t.weaknesses.map(e=>`<li style="margin-bottom: 5px;">${e}</li>`).join("")}
        </ul>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Color Palette</h2>
        <div style="margin-bottom: 15px; line-height: 1.8;">
          ${o}
        </div>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Typography</h2>
        <p style="margin-bottom: 5px;"><strong>Heading Font:</strong> ${t.fonts.heading}</p>
        <p style="margin-bottom: 15px;"><strong>Body Font:</strong> ${t.fonts.body}</p>
        
        <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Bio</h2>
        <p style="margin-bottom: 15px; line-height: 1.6;">${t.bio}</p>
        
        ${t.examples&&t.examples.length>0?`
          <h2 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Usage Examples</h2>
          ${t.examples.map(e=>`
            <div style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; border-left: 3px solid #333;">
              <h3 style="font-size: 14px; margin-bottom: 5px;">${e.context}</h3>
              <p style="font-style: italic;">"${e.example}"</p>
            </div>
          `).join("")}
        `:""}
      </div>
    `}static generateCVHTML(t){const o=t.experience.map(i=>`
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 14px; margin-bottom: 5px; color: #333;">${i.role} at ${i.org}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${i.dates}</p>
          <ul style="margin-left: 20px;">
            ${i.bullets.map(n=>`<li style="margin-bottom: 3px; font-size: 12px;">${n}</li>`).join("")}
          </ul>
        </div>
      `).join(""),e=t.links.map(i=>`<span style="margin-right: 15px;">${i.label}: ${i.url}</span>`).join("");return`
      <div style="max-width: 210mm; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 5px; color: #333;">${t.name}</h1>
        <h2 style="font-size: 16px; margin-bottom: 15px; color: #666; font-weight: normal;">${t.role}</h2>
        
        <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Summary</h3>
        <p style="margin-bottom: 20px; line-height: 1.6;">${t.summary}</p>
        
        <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 15px; color: #333;">Experience</h3>
        ${o}
        
        <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Skills</h3>
        <p style="margin-bottom: 20px;">${t.skills.join(", ")}</p>
        
        ${t.links&&t.links.length>0?`
          <h3 style="font-size: 18px; margin-top: 20px; margin-bottom: 10px; color: #333;">Links</h3>
          <div style="font-size: 12px; line-height: 1.8;">
            ${e}
          </div>
        `:""}
      </div>
    `}}m(E,"DEFAULT_OPTIONS",{format:"a4",orientation:"portrait",margins:{top:20,right:20,bottom:20,left:20},quality:1,filename:"document.pdf"});class O{static async exportBrandRiderHero(t,o={}){const e={...this.DEFAULT_OPTIONS,...o},i=this.generateBrandRiderHeroHTML(t);return this.generatePNG(i,{...e,filename:e.filename||`${t.title.toLowerCase().replace(/\s+/g,"-")}-hero.png`})}static async exportCVHero(t,o={}){const e={...this.DEFAULT_OPTIONS,...o},i=this.generateCVHeroHTML(t);return this.generatePNG(i,{...e,filename:e.filename||`${t.name.toLowerCase().replace(/\s+/g,"-")}-hero.png`})}static async exportElement(t,o={}){const e={...this.DEFAULT_OPTIONS,...o};try{const{html2canvas:i}=await x(),n=await i(t,{width:e.width,height:e.height,scale:e.scale,backgroundColor:e.backgroundColor,useCORS:!0,allowTaint:!1,logging:!1});return this.canvasToResult(n,e)}catch(i){throw new Error(`PNG export failed: ${i instanceof Error?i.message:"Unknown error"}`)}}static async exportHTML(t,o={}){const e={...this.DEFAULT_OPTIONS,...o};return this.generatePNG(t,e)}static async generatePNG(t,o){try{const{html2canvas:e}=await x(),i=document.createElement("div");i.innerHTML=t,i.style.position="absolute",i.style.left="-9999px",i.style.top="-9999px",i.style.width=`${o.width}px`,i.style.height=`${o.height}px`,i.style.backgroundColor=o.backgroundColor,i.style.overflow="hidden",document.body.appendChild(i);try{const n=await e(i,{width:o.width,height:o.height,scale:o.scale,backgroundColor:o.backgroundColor,useCORS:!0,allowTaint:!1,logging:!1});return this.canvasToResult(n,o)}finally{document.body.removeChild(i)}}catch(e){throw new Error(`PNG export failed: ${e instanceof Error?e.message:"Unknown error"}`)}}static canvasToResult(t,o){return new Promise((e,i)=>{const n=this.getMimeType(o.format);t.toBlob(s=>{if(!s){i(new Error("Failed to generate image blob"));return}const c=URL.createObjectURL(s);e({blob:s,url:c,filename:o.filename,width:t.width,height:t.height})},n,o.quality)})}static getMimeType(t){switch(t){case"jpeg":return"image/jpeg";case"webp":return"image/webp";case"png":default:return"image/png"}}static generateBrandRiderHeroHTML(t){var i,n;const o=((i=t.palette[0])==null?void 0:i.hex)||"#333333",e=((n=t.palette[1])==null?void 0:n.hex)||"#666666";return`
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, ${o}20, ${e}20);
        font-family: '${t.fonts.heading}', Arial, sans-serif;
        text-align: center;
        padding: 60px 40px;
        box-sizing: border-box;
      ">
        <h1 style="
          font-size: 48px;
          font-weight: bold;
          color: ${o};
          margin: 0 0 20px 0;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">${t.title}</h1>
        
        <p style="
          font-size: 24px;
          color: ${e};
          margin: 0 0 30px 0;
          font-style: italic;
          font-family: '${t.fonts.body}', Arial, sans-serif;
        ">${t.tagline}</p>
        
        <div style="
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
          flex-wrap: wrap;
          justify-content: center;
        ">
          ${t.palette.slice(0,5).map(s=>`
            <div style="
              width: 40px;
              height: 40px;
              background-color: ${s.hex};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            "></div>
          `).join("")}
        </div>
        
        <div style="
          background: rgba(255,255,255,0.9);
          padding: 20px 30px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 80%;
        ">
          <p style="
            font-size: 18px;
            color: #333;
            margin: 0;
            line-height: 1.4;
            font-family: '${t.fonts.body}', Arial, sans-serif;
          ">${t.voiceTone.slice(0,3).join(" • ")}</p>
        </div>
      </div>
    `}static generateCVHeroHTML(t){return`
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        font-family: 'Inter', Arial, sans-serif;
        text-align: center;
        padding: 60px 40px;
        box-sizing: border-box;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          max-width: 90%;
          width: 100%;
        ">
          <h1 style="
            font-size: 42px;
            font-weight: bold;
            color: #1e293b;
            margin: 0 0 10px 0;
            line-height: 1.2;
          ">${t.name}</h1>
          
          <h2 style="
            font-size: 24px;
            color: #64748b;
            margin: 0 0 25px 0;
            font-weight: normal;
          ">${t.role}</h2>
          
          <p style="
            font-size: 16px;
            color: #475569;
            margin: 0 0 25px 0;
            line-height: 1.6;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">${t.summary}</p>
          
          <div style="
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
          ">
            ${t.skills.slice(0,6).map(o=>`
              <span style="
                background: #e2e8f0;
                color: #475569;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
              ">${o}</span>
            `).join("")}
          </div>
        </div>
      </div>
    `}static async createSocialMediaImage(t,o="twitter",e={}){const i=this.getSocialMediaDimensions(o),n={...this.DEFAULT_OPTIONS,...i,...e,filename:e.filename||`${t.title.toLowerCase().replace(/\s+/g,"-")}-${o}.png`},s=this.generateSocialMediaHTML(t,o);return this.generatePNG(s,n)}static getSocialMediaDimensions(t){switch(t){case"twitter":return{width:1200,height:675};case"linkedin":return{width:1200,height:627};case"instagram":return{width:1080,height:1080};case"facebook":return{width:1200,height:630};default:return{width:1200,height:630}}}static generateSocialMediaHTML(t,o){const e=t.colors[0]||"#333333",i=t.colors[1]||"#666666";return`
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, ${e}15, ${i}15);
        font-family: 'Inter', Arial, sans-serif;
        text-align: center;
        padding: 40px;
        box-sizing: border-box;
        position: relative;
      ">
        <div style="
          background: rgba(255,255,255,0.95);
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          max-width: 80%;
          backdrop-filter: blur(10px);
        ">
          <h1 style="
            font-size: ${o==="instagram"?"36px":"42px"};
            font-weight: bold;
            color: ${e};
            margin: 0 0 ${t.subtitle?"15px":"0"} 0;
            line-height: 1.2;
          ">${t.title}</h1>
          
          ${t.subtitle?`
            <p style="
              font-size: ${o==="instagram"?"18px":"20px"};
              color: ${i};
              margin: 0;
              line-height: 1.4;
            ">${t.subtitle}</p>
          `:""}
        </div>
        
        <div style="
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
        ">
          ${t.colors.slice(0,4).map(n=>`
            <div style="
              width: 20px;
              height: 20px;
              background-color: ${n};
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            "></div>
          `).join("")}
        </div>
      </div>
    `}}m(O,"DEFAULT_OPTIONS",{width:1200,height:630,quality:.95,backgroundColor:"#ffffff",scale:2,filename:"image.png",format:"png"});export{v as P,E as a,O as b,x as l};
