import { SvelteComponentTyped } from "svelte";
import type { SvelteRow } from '../../core/row';
declare const __propDef: {
    props: {
        row: SvelteRow;
    };
    events: {
        rowCollapsed: CustomEvent<any>;
        rowExpanded: CustomEvent<any>;
    } & {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export type TableTreeCellProps = typeof __propDef.props;
export type TableTreeCellEvents = typeof __propDef.events;
export type TableTreeCellSlots = typeof __propDef.slots;
export default class TableTreeCell extends SvelteComponentTyped<TableTreeCellProps, TableTreeCellEvents, TableTreeCellSlots> {
}
export {};
