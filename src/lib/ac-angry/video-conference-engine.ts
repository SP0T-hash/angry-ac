/**
 * Video Conference Engine for Angry AC
 * Handles local recording using MediaRecorder API for ICP-Brasil compliance.
 */

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
}

export class VideoConferenceEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;

  constructor(private stream: MediaStream) {}

  start() {
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.startTime = Date.now();
    this.mediaRecorder.start();
  }

  stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Recorder not initialized"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - this.startTime) / 1000;
        resolve({ blob, url, duration });
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
