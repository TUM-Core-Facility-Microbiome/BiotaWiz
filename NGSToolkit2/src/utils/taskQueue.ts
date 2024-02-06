import {updateProgress} from "./logHandler";

class TaskQueue {
    private queue: (() => Promise<void>)[] = [];
    private isProcessing = false;

    defer<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const taskWrapper = async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            this.queue.push(taskWrapper);
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    private async processQueue(): Promise<void> {
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                try {
                    await task();
                } catch (error) {
                    console.error('Error processing task:', error);
                }
            }
        }
        this.isProcessing = false;
    }
}

export const taskQueue = new TaskQueue();
