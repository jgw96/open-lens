import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js'

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import { getTextData, initText } from '../services/text';
import { analyzeImage } from '../services/analysis';
import { chooseFileToAnalyze } from '../services/handle-files';

@customElement('app-camera')
export class AppCamera extends LitElement {
    @state() stream: MediaStream | null = null;
    @state() capture: any | null = null;
    @state() found: any = null;

    @state() moreInfo: any[] | null = null;
    @state() moreImages: any[] | null = null;
    @state() predictions: any[] | null = null;

    @state() mode: 'general' | 'text' = 'general';

    @state() text: string = "";

    video: HTMLVideoElement | null = null;
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    model: any | undefined;
    currentResult: any | undefined;

    static styles = [
        css`
            :host {
                display: block;
            }

            canvas {
                position: fixed;
                inset: 0px;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
            }

            #info-drawer {
                --size: 100vw;
            }

            #images-block {
                overflow-y: hidden;
                max-height: 400px;
                margin-top: 20px;
                border-radius: 8px;

                scroll-snap-type: x mandatory;
                overflow-x: scroll;
                display: flex;
                gap: 8px;
            }

            #bing-results {
                overflow-y: hidden;
                overflow-x: scroll;
                height: 210px;
                margin-top: 20px;
                border-radius: 8px;
                scroll-snap-type: x mandatory;
                display: flex;
                flex-direction: row;
                gap: 8px;
            }

            #bing-results li {
                display: block;
                scroll-snap-align: start;
                display: block;
                width: 300px;
            }

            #bing-results li div {
                width: 300px;
            }

            #images-block img {
                width: 90%;
                object-fit: cover;
                border-radius: 8px;
                scroll-snap-align: start;
            }

            video {


                display: none;
            }

            #controls {
                z-index: 1;
                position: absolute;
                z-index: 9;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                backdrop-filter: blur(40px);
                background-color: rgb(35 39 52 / 28%);

                padding: 10px;

                animation-name: slideUp;
                animation-duration: 300ms;
                animation-timing-function: ease-in-out;
            }

            #choose-file {
                z-index: 1;
            }

            #info-block {
                z-index: 1;
                position: absolute;
                z-index: 9;
                bottom: 60px;
                left: 0;
                right: 0;
                display: flex;
                backdrop-filter: blur(40px);
                background: #18181875;
                flex-direction: column;

                padding: 10px;
                transform: translateY(100%);
                transition: transform 0.3s ease-in-out;
            }

            #info-block h2 {
                color: white;
                font-size: 1.5rem;
                margin: 0;
            }

            #info-block.show {
                transform: translateY(0);
            }

            #image-block {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            #image-block img {
                border-radius: 8px;
                height: 4em;
                width: 4em;
            }

            ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 14px;
                margin-top: 1em;
            }

            li {
                border: solid 2px var(--sl-color-primary-200);
                border-radius: 8px;
                padding: 10px;
                cursor: pointer;
            }

            h3 {
                margin-top: 2em;
                font-size: 1.2em;
                margin-bottom: 0;
            }

            sl-card::part(footer) {
                display: flex;
                justify-content: flex-end;
            }

            #start {
                display: flex;
                justify-content: center;
                height: 62vh;
                align-items: center;
                gap: 8px;
            }

            #other-options {
                display: flex;
                margin-bottom: 1em;
                gap: 4px;
                min-height: 40px;
            }

            #choosePhoto::part(base) {
                background-color: rgba(35, 39, 52, 0.86);
            }

            .link-card h4 {
                margin-bottom: 0;
                margin-top: 6px;
            }

            @media (max-width: 600px) {
                #controls {
                    overflow-x: auto;
                    overflow-y: hidden;
                    padding: 10px;

                    gap: 6px;
                }
            }

            @media (min-width: 600px) {
                #controls {
                    justify-content: end;
                    gap: 8px;
                    bottom: initial;

                    left: initial;
                    right: 10px;
                    border-radius: 8px;
                    bottom: 12px;
                    width: fit-content;
                }
            }

            // slide up animation
            @keyframes slideUp {
                0% {
                    transform: translateY(100%);
                }
                100% {
                    transform: translateY(0);
                }
            }
        `
    ];

    async firstUpdated() {
        // await this.init();
    }

    async init() {
        // get outward facing camera
        const streamData = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment'
            }, audio: false
        });

        // @ts-ignore
        this.model = await cocoSsd.load();

        this.hookUpStream(streamData);

        const canvas = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
        this.canvas = canvas;
    }

    async chooseFile() {
        const blob = await chooseFileToAnalyze();
        const file = await blob.handle?.getFile();
        if (file) {
            // const data = await analyzeImage(blob);
            // console.log('choose file', data);

            if (!this.model) {
                // @ts-ignore
                this.model = await cocoSsd.load();
            }

            const image = new Image();
            image.src = URL.createObjectURL(file);

            image.onload = async () => {
                const results = await this.model.detect(image);
                console.log('choose file', results);

                this.currentResult = results[0];

                await this.updateComplete;

                await this.getInfo();
            }
        }
    }

    private hookUpStream(streamData: MediaStream) {
        const video = this.shadowRoot?.querySelector('video') as any;
        this.video = video;

        if (streamData) {
            this.stream = streamData;
            video.srcObject = streamData;
            video.play();

            video.requestVideoFrameCallback(this.onFrame.bind(this));

            const mediaStreamTrack = this.stream.getVideoTracks()[0];
            // @ts-ignore
            const imageCapture = new ImageCapture(mediaStreamTrack);
            this.capture = imageCapture;
        }
    }

    async onFrame() {
        if (this.canvas && this.video) {
            if (!this.ctx) {
              this.ctx = this.canvas.getContext('2d');
            }

            if (this.ctx) {
              this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            }

            const results = await this.model.detect(this.canvas);
            if (results) {
                if (results[0] && results[0].bbox) {
                    this.ctx!.beginPath();
                    // @ts-ignore
                    this.ctx!.rect(...results[0].bbox);
                    this.ctx!.lineWidth = 1;
                    this.ctx!.strokeStyle = 'white';
                    this.ctx!.fillStyle = 'white';
                    this.ctx!.stroke();
                    this.ctx!.fillText(
                        results[0].class, results[0].bbox[0],
                        results[0].bbox[1] > 10 ? results[0].bbox[1] - 5 : 10);

                    this.currentResult = results[0];
                }
            }

            // request next frame
            (this.video as any).requestVideoFrameCallback(this.onFrame.bind(this));
        }
    }

    async takePhoto() {
        if (this.capture) {
            const blob = await this.capture.takePhoto();
            console.log('blob', blob);

            // draw blob to canvas
            await this.getInfo();
        }
    }

    private async getInfo() {
        console.log("this.currentResult", this.currentResult.class)

        await this.bingSearch(this.currentResult.class);
        //             this.predictions = predictions;
    }

    private async bingSearch(searchTerm: string) {
        const response = await fetch(`https://api.bing.microsoft.com/v7.0/entities?mkt=en-us&q=${searchTerm}`, {
            method: "GET",
            headers: {
                'Ocp-Apim-Subscription-Key': '3da565390ffd497ea2b0fd8ccae88863'
            }
        });

        const data = await response.json();
        console.log('data', data);

        this.found = data.entities ? data.entities.value[0] : data.queryContext.originalQuery;
        console.log('this.found', this.found);

        const drawer: any = this.shadowRoot?.querySelector("#info-drawer");
        if (drawer) {
            await drawer.show();
        }

        const found = this.found.name ? this.found.name : this.found;

        // find extra info from bing search api
        const response2 = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${found}`, {
            method: "GET",
            headers: {
                'Ocp-Apim-Subscription-Key': '3da565390ffd497ea2b0fd8ccae88863'

            }
        });

        const data2 = await response2.json();
        console.log('data2', data2);

        this.moreInfo = data2.webPages.value;
        this.moreImages = data2.images.value;
    }

    async doText() {
        if (this.capture) {
            const blob = await this.capture.takePhoto();
            console.log('blob', blob);

            const resp = await initText(blob);

            setTimeout(async () => {
                const data = await getTextData(resp);
                console.log("text", data);

                let text = "";
                data.recognitionResults[0]?.lines?.forEach((line: any) => {
                    // concat line text
                    text += line.text + " ";
                });

                this.text = text;

                const drawer: any = this.shadowRoot?.querySelector("#text-drawer");
                if (drawer) {
                    await drawer.show();
                }


            }, 3000);
        }
    }

    async describeImage() {
        if (this.capture) {
            const blob = await this.capture.takePhoto();
            if (blob) {
                const data = await analyzeImage(blob);
                console.log('data', data);

                this.text = data.description.captions[0].text;

                const drawer: any = this.shadowRoot?.querySelector("#text-drawer");
                if (drawer) {
                    await drawer.show();
                }

            }
        }
    }

    async copy() {
        await navigator.clipboard.writeText(this.text);
    }

    async share() {
        if (navigator.share) {
            await navigator.share({
                title: 'Share',
                text: this.text,
            })
        }
    }

    openLink(url: string) {
        // open url
        window.open(url, '_blank')
    }

    render() {
        return html`
        <video></video>
        <canvas></canvas>

        ${
            !this.stream ? html`
              <div id="start">
                <sl-button variant="primary" pill @click=${this.init}>
                  Start Camera
                  <sl-icon slot="suffix" src="/assets/camera-outline.svg"></sl-icon>
                </sl-button>

                <sl-button id="choose-file" pill @click=${this.chooseFile}>
                  Choose File
                  <sl-icon slot="suffix" src="/assets/image-outline.svg"></sl-icon>
                </sl-button>
              </div>

            ` : null
        }

        <sl-drawer id="text-drawer">
            <p>${this.text}</p>

            <div id="text-controls" slot="footer">
                <sl-button @click=${this.share}>Share</sl-button>
                <sl-button @click=${this.copy}>Copy</sl-button>
            </div>
        </sl-drawer>

        <sl-drawer id="info-drawer">

            <div id="image-block">
                ${this.found && this.found.image ? html`<img src="${this.found?.image?.thumbnailUrl}"
                    alt="${this.found?.name}" />` : null}
                <h2>${this.found?.name ? this.found.name : this.found}</h2>
            </div>
            <p>${this.found?.description || ""}</p>

            <div id="more">
                <h3>Bing Results</h3>
                <ul id="bing-results">
                    ${
                        this.moreInfo?.map((item: any) => {
                            return html`
                              <li @click="${() => this.openLink(item.url)}">
                                <div class="link-card">
                                    <h4>${item.name}</h4>
                                    <p>${item.snippet}</p>
                                </div>
                              </li>
                            `
                        })
                    }
                </ul>

                <h3>Similar Images</h3>
                <div id="images-block">
                    ${
                        this.moreImages?.map((item: any) => {
                            return html`
                              <img src="${item.thumbnailUrl}" alt="${item.name}" />
                            `
                        })
                    }
                </div>
            </div>
        </sl-drawer>

        ${this.stream ? html`<div id="controls">
           <sl-button pill @click="${this.describeImage}">
                Describe
                <sl-icon slot="suffix" src="/assets/book-outline.svg" label="Describe"></sl-icon>
            </sl-button>

            <sl-button pill variant="primary" @click=${this.takePhoto}>
              Search
              <sl-icon slot="suffix" src="/assets/search-outline.svg" label="Search"></sl-icon>
            </sl-button>

            <sl-button pill @click=${this.doText}>
              Get Text

              <sl-icon slot="suffix" src="/assets/scan-outline.svg" label="Get Text"></sl-icon>
            </sl-button>
        </div>` : null}
        `;
    }
}
