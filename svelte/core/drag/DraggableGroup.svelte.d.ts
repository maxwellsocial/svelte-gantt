import { SvelteComponentTyped } from "svelte";
import type { DragChange, DragContext } from './DragContext';
declare const __propDef: {
    props: {
        items?: {
            [taskId: PropertyKey]: Partial<{
                xDelta: number;
                yDelta: number;
                width: number;
                bWidth: number;
                widthDelta: number;
            }> & Partial<{
                dragging: boolean;
                resizing: boolean;
                x: number;
                y: number;
                width: number;
                ignoreClick: boolean;
            }>;
        };
    };
    events: {
        change: CustomEvent<{
            changes: DragChange[];
        }>;
        itemsChange: CustomEvent<{
            items: {
                [taskId: PropertyKey]: Partial<{
                    xDelta: number;
                    yDelta: number;
                    width: number;
                    bWidth: number;
                    widthDelta: number;
                }> & Partial<{
                    dragging: boolean;
                    resizing: boolean;
                    x: number;
                    y: number;
                    width: number;
                    ignoreClick: boolean;
                }>;
            };
        }>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            context: DragContext;
        };
    };
};
export type DraggableGroupProps = typeof __propDef.props;
export type DraggableGroupEvents = typeof __propDef.events;
export type DraggableGroupSlots = typeof __propDef.slots;
export default class DraggableGroup extends SvelteComponentTyped<DraggableGroupProps, DraggableGroupEvents, DraggableGroupSlots> {
}
export {};
