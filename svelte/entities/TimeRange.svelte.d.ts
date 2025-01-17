import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        model: any;
        left: any;
        width: any;
        resizing?: boolean;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type TimeRangeProps = typeof __propDef.props;
export type TimeRangeEvents = typeof __propDef.events;
export type TimeRangeSlots = typeof __propDef.slots;
export default class TimeRange extends SvelteComponentTyped<TimeRangeProps, TimeRangeEvents, TimeRangeSlots> {
}
export {};
