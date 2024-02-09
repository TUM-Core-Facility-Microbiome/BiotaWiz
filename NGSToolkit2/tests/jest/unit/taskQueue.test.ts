import {taskQueue} from "../../../src/utils/taskQueue";

describe('TaskQueue', () => {
    test('defer should pick all tasks', async () => {
        for (let i = 0; i < 3; i++) {
            const task = jest.fn(() => Promise.resolve());
            await taskQueue.defer(task);
            expect(task).toBeCalledTimes(1);
            expect(task).toBeCalledWith();
            expect(task).toHaveReturnedTimes(1);
        }
    });

    test('defer should pick all tasks in order', async () => {
        const tasks = [jest.fn(() => Promise.resolve(1)), jest.fn(() => Promise.resolve(2)), jest.fn(() => Promise.resolve(3))];
        const results = await Promise.all(tasks.map(task => taskQueue.defer(task)));
        expect(results).toEqual([1, 2, 3]);
    });

    test('defer should pick all tasks in order even if they fail', async () => {
        const tasks = [jest.fn(() => Promise.reject(1)), jest.fn(() => Promise.reject(2)), jest.fn(() => Promise.resolve(3))];
        const results = await Promise.all(tasks.map(task => taskQueue.defer(task).catch(e => e)));
        expect(results).toEqual([1, 2, 3]);
    });

    test('defer should return the result of the task', async () => {
        const task = jest.fn(() => Promise.resolve(42));
        const result = await taskQueue.defer(task);
        expect(result).toBe(42);
    }, 1000);

    test('defer should handle tasks being submitted at the same time', async () => {
        const task = jest.fn(() => Promise.resolve());
        const task2 = jest.fn(() => Promise.resolve());
        const task3 = jest.fn(() => Promise.resolve());
        await Promise.all([taskQueue.defer(task), taskQueue.defer(task2), taskQueue.defer(task3)]);
        expect(task).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
    });

    test('defer should work with tasks throwing an error', async () => {
        const task = jest.fn(() => {
            throw new Error('Task failed');
        });
        const task2 = jest.fn(() => Promise.resolve());
        const task3 = jest.fn(() => Promise.resolve());
        await Promise.all([taskQueue.defer(task).catch(e => e), taskQueue.defer(task2), taskQueue.defer(task3)]);
        expect(task).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(1);
        expect(task3).toHaveBeenCalledTimes(1);
    });

    test('defer should not begin new tasks if there is a task in progress', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const task = jest.fn(() => new Promise<void>(() => {}));  // never resolves
        const task2 = jest.fn(() => Promise.resolve());
        const task3 = jest.fn(() => Promise.resolve());
        taskQueue.defer(task);
        taskQueue.defer(task2);
        taskQueue.defer(task3);
        expect(task).toHaveBeenCalledTimes(1);
        expect(task2).toHaveBeenCalledTimes(0);
        expect(task3).toHaveBeenCalledTimes(0);

        // cleanup: resolve the first task
        task.mockClear();
    });
});
