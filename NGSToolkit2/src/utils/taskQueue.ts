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

    clear(): void {
        this.queue = [];
    }

    private async processQueue(): Promise<void> {
        while (this.queue.length > 0) {
            this.isProcessing = true;
            console.log('Setting isProcessing lock.');

            const task = this.queue.shift();
            if (task) {
                try {
                    console.debug(`Picking new task from queue. Waiting: ${this.queue.length}`);
                    await task().finally(() => {
                        console.log('Releasing isProcessing lock.');
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
