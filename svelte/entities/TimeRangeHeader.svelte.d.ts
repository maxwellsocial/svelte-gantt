import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        model: any;
        width: any;
        left: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type TimeRangeHeaderProps = typeof __propDef.props;
export type TimeRangeHeaderEvents = typeof __propDef.events;
export type TimeRangeHeaderSlots = typeof __propDef.slots;
export default class TimeRangeHeader extends SvelteComponentTyped<TimeRangeHeaderProps, TimeRangeHeaderEvents, TimeRangeHeaderSlots> {
}
export {};
