import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        id: any;
        fromId: any;
        toId: any;
        stroke?: string;
        strokeWidth?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type DependencyProps = typeof __propDef.props;
export type DependencyEvents = typeof __propDef.events;
export type DependencySlots = typeof __propDef.slots;
export default class Dependency extends SvelteComponentTyped<DependencyProps, DependencyEvents, DependencySlots> {
}
export {};
