class TaskQueue {
    private queue: (() => Promise<void>)[] = [];
    private isProcessing = false;

    defer<T>(task: () => Promise<T>): Promise<T> {
        console.debug(`Adding task to queue. Waiting: ${this.queue.length}; Processing: ${this.isProcessing}`);
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

    isBusy(): boolean {
        return this.isProcessing || this.queue.length > 0;
    }

    clear(): void {
        this.queue = [];
    }

    private async processQueue(): Promise<void> {
        while (this.queue.length > 0) {
            this.isProcessing = true;

            const task = this.queue.shift();
            if (task) {
                try {
                    await task().finally(() => {
                        this.isProcessing = false;
                    });
                } catch (error) {
                    console.error('Error processing task:', error);
                }
            }
        }
    }
}

export const taskQueue = new TaskQueue();
