export interface RowModel {
    /**
     * Id of row, every resource needs to have a unique one
     */
    id: PropertyKey;
    label: string;
    classes?: string | string[];
    contentHtml?: string;
    height?: number;
    /**
     * enable dragging to row
     * @deprecated use draggable
     **/
    enableDragging?: boolean;
    /**
     * enable dragging to row
     **/
    draggable?: boolean;
    /**
     * enable resizing on row
     * @deprecated use resizable
     */
    enableResize?: boolean;
    /**
     * enable resizing on row
     */
    resizable?: boolean;
    /** Child rows in expandable tree */
    children?: RowModel[];
    expanded?: boolean;
    /** Content of row header, html string */
    headerHtml?: string;
    /**
     * Class of icon in row header
     * @deprecated
     **/
    iconClass?: string;
    /**
     * Url of image in row header
     * @deprecated
     **/
    imageSrc?: string;
}
export interface SvelteRow {
    model: RowModel;
    y: number;
    height: number;
    hidden?: boolean;
    children?: SvelteRow[];
    allChildren?: SvelteRow[];
    parent?: SvelteRow;
    allParents?: SvelteRow[];
    childLevel?: number;
}
export type CreateRowParams = {
    rowHeight: number;
};
export declare function createRows(rows: RowModel[], params: CreateRowParams): any[];
export declare function expandRow(row: SvelteRow): void;
export declare function collapseRow(row: SvelteRow): void;
