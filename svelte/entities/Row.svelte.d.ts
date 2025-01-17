import { SvelteComponentTyped } from "svelte";
import type { SvelteRow } from '../core/row';
declare const __propDef: {
    props: {
        row: SvelteRow;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type RowProps = typeof __propDef.props;
export type RowEvents = typeof __propDef.events;
export type RowSlots = typeof __propDef.slots;
export default class Row extends SvelteComponentTyped<RowProps, RowEvents, RowSlots> {
}
export {};
