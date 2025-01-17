import { SvelteComponentTyped } from "svelte";
import type { TaskModel } from '../core/task';
declare const __propDef: {
    props: {
        model: TaskModel;
        height: number;
        left: number;
        top: number;
        width: number;
        reflected?: boolean;
        animating?: boolean;
        dragging?: boolean;
        resizing?: boolean;
    };
    events: {
        pointerdown: PointerEvent;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type TaskProps = typeof __propDef.props;
export type TaskEvents = typeof __propDef.events;
export type TaskSlots = typeof __propDef.slots;
export default class Task extends SvelteComponentTyped<TaskProps, TaskEvents, TaskSlots> {
}
export {};
