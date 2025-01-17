/** @typedef {typeof __propDef.props}  ContextMenuProps */
/** @typedef {typeof __propDef.events}  ContextMenuEvents */
/** @typedef {typeof __propDef.slots}  ContextMenuSlots */
export default class ContextMenu extends SvelteComponentTyped<{
    left: any;
    top: any;
    position?: (point: any) => void;
    actions?: any[];
    onactionend?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
    get position(): (point: any) => void;
}
export type ContextMenuProps = typeof __propDef.props;
export type ContextMenuEvents = typeof __propDef.events;
export type ContextMenuSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        left: any;
        top: any;
        position?: (point: any) => void;
        actions?: any[];
        onactionend?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
