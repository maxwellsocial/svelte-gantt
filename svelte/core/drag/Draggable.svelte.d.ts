import { SvelteComponentTyped } from "svelte";
import type { SvelteTask } from "../task";
declare const __propDef: {
    props: {
        task: SvelteTask;
        dragAllowed?: (task: SvelteTask) => boolean;
        resizeAllowed?: (task: SvelteTask) => boolean;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            state: {
                x: number;
                y: number;
                width: number;
                dragging: boolean;
                resizing: boolean;
            };
            onPointerDown: (event: PointerEvent) => void;
        };
    };
};
export type DraggableProps = typeof __propDef.props;
export type DraggableEvents = typeof __propDef.events;
export type DraggableSlots = typeof __propDef.slots;
export default class Draggable extends SvelteComponentTyped<DraggableProps, DraggableEvents, DraggableSlots> {
    get dragAllowed(): (task: SvelteTask) => boolean;
    get resizeAllowed(): (task: SvelteTask) => boolean;
}
export {};
