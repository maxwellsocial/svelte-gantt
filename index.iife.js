(function (exports) {
	'use strict';

	/** @returns {void} */
	function noop() {}

	/**
	 * @template T
	 * @template S
	 * @param {T} tar
	 * @param {S} src
	 * @returns {T & S}
	 */
	function assign(tar, src) {
		// @ts-ignore
		for (const k in src) tar[k] = src[k];
		return /** @type {T & S} */ (tar);
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	let src_url_equal_anchor;

	/**
	 * @param {string} element_src
	 * @param {string} url
	 * @returns {boolean}
	 */
	function src_url_equal(element_src, url) {
		if (element_src === url) return true;
		if (!src_url_equal_anchor) {
			src_url_equal_anchor = document.createElement('a');
		}
		// This is actually faster than doing URL(..).href
		src_url_equal_anchor.href = url;
		return element_src === src_url_equal_anchor.href;
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	function subscribe(store, ...callbacks) {
		if (store == null) {
			for (const callback of callbacks) {
				callback(undefined);
			}
			return noop;
		}
		const unsub = store.subscribe(...callbacks);
		return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}

	/** @returns {void} */
	function component_subscribe(component, store, callback) {
		component.$$.on_destroy.push(subscribe(store, callback));
	}

	function create_slot(definition, ctx, $$scope, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, $$scope, fn) {
		return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
	}

	function get_slot_changes(definition, $$scope, dirty, fn) {
		if (definition[2] && fn) {
			const lets = definition[2](fn(dirty));
			if ($$scope.dirty === undefined) {
				return lets;
			}
			if (typeof lets === 'object') {
				const merged = [];
				const len = Math.max($$scope.dirty.length, lets.length);
				for (let i = 0; i < len; i += 1) {
					merged[i] = $$scope.dirty[i] | lets[i];
				}
				return merged;
			}
			return $$scope.dirty | lets;
		}
		return $$scope.dirty;
	}

	/** @returns {void} */
	function update_slot_base(
		slot,
		slot_definition,
		ctx,
		$$scope,
		slot_changes,
		get_slot_context_fn
	) {
		if (slot_changes) {
			const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
			slot.p(slot_context, slot_changes);
		}
	}

	/** @returns {any[] | -1} */
	function get_all_dirty_from_scope($$scope) {
		if ($$scope.ctx.length > 32) {
			const dirty = [];
			const length = $$scope.ctx.length / 32;
			for (let i = 0; i < length; i++) {
				dirty[i] = -1;
			}
			return dirty;
		}
		return -1;
	}

	/** @returns {{}} */
	function exclude_internal_props(props) {
		const result = {};
		for (const k in props) if (k[0] !== '$') result[k] = props[k];
		return result;
	}

	/** @returns {{}} */
	function compute_rest_props(props, keys) {
		const rest = {};
		keys = new Set(keys);
		for (const k in props) if (!keys.has(k) && k[0] !== '$') rest[k] = props[k];
		return rest;
	}

	function null_to_empty(value) {
		return value == null ? '' : value;
	}

	function set_store_value(store, ret, value) {
		store.set(value);
		return ret;
	}

	function action_destroyer(action_result) {
		return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @template {keyof SVGElementTagNameMap} K
	 * @param {K} name
	 * @returns {SVGElement}
	 */
	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @returns {(event: any) => any} */
	function stop_propagation(fn) {
		return function (event) {
			event.stopPropagation();
			// @ts-ignore
			return fn.call(this, event);
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data(text, data) {
		data = '' + data;
		if (text.data === data) return;
		text.data = /** @type {string} */ (data);
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, important ? 'important' : '');
		}
	}
	// unfortunately this can't be a constant as that wouldn't be tree-shakeable
	// so we cache the result instead

	/**
	 * @type {boolean} */
	let crossorigin;

	/**
	 * @returns {boolean} */
	function is_crossorigin() {
		if (crossorigin === undefined) {
			crossorigin = false;
			try {
				if (typeof window !== 'undefined' && window.parent) {
					void window.parent.document;
				}
			} catch (error) {
				crossorigin = true;
			}
		}
		return crossorigin;
	}

	/**
	 * @param {HTMLElement} node
	 * @param {() => void} fn
	 * @returns {() => void}
	 */
	function add_iframe_resize_listener(node, fn) {
		const computed_style = getComputedStyle(node);
		if (computed_style.position === 'static') {
			node.style.position = 'relative';
		}
		const iframe = element('iframe');
		iframe.setAttribute(
			'style',
			'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
				'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;'
		);
		iframe.setAttribute('aria-hidden', 'true');
		iframe.tabIndex = -1;
		const crossorigin = is_crossorigin();

		/**
		 * @type {() => void}
		 */
		let unsubscribe;
		if (crossorigin) {
			iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
			unsubscribe = listen(
				window,
				'message',
				/** @param {MessageEvent} event */ (event) => {
					if (event.source === iframe.contentWindow) fn();
				}
			);
		} else {
			iframe.src = 'about:blank';
			iframe.onload = () => {
				unsubscribe = listen(iframe.contentWindow, 'resize', fn);
				// make sure an initial resize event is fired _after_ the iframe is loaded (which is asynchronous)
				// see https://github.com/sveltejs/svelte/issues/4233
				fn();
			};
		}
		append(node, iframe);
		return () => {
			if (crossorigin) {
				unsubscribe();
			} else if (unsubscribe && iframe.contentWindow) {
				unsubscribe();
			}
			detach(iframe);
		};
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}
	/** */
	class HtmlTag {
		/**
		 * @private
		 * @default false
		 */
		is_svg = false;
		/** parent for creating node */
		e = undefined;
		/** html tag nodes */
		n = undefined;
		/** target */
		t = undefined;
		/** anchor */
		a = undefined;
		constructor(is_svg = false) {
			this.is_svg = is_svg;
			this.e = this.n = null;
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		c(html) {
			this.h(html);
		}

		/**
		 * @param {string} html
		 * @param {HTMLElement | SVGElement} target
		 * @param {HTMLElement | SVGElement} anchor
		 * @returns {void}
		 */
		m(html, target, anchor = null) {
			if (!this.e) {
				if (this.is_svg)
					this.e = svg_element(/** @type {keyof SVGElementTagNameMap} */ (target.nodeName));
				/** #7364  target for <template> may be provided as #document-fragment(11) */ else
					this.e = element(
						/** @type {keyof HTMLElementTagNameMap} */ (
							target.nodeType === 11 ? 'TEMPLATE' : target.nodeName
						)
					);
				this.t =
					target.tagName !== 'TEMPLATE'
						? target
						: /** @type {HTMLTemplateElement} */ (target).content;
				this.c(html);
			}
			this.i(anchor);
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		h(html) {
			this.e.innerHTML = html;
			this.n = Array.from(
				this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes
			);
		}

		/**
		 * @returns {void} */
		i(anchor) {
			for (let i = 0; i < this.n.length; i += 1) {
				insert(this.t, this.n[i], anchor);
			}
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		p(html) {
			this.d();
			this.h(html);
			this.i(this.a);
		}

		/**
		 * @returns {void} */
		d() {
			this.n.forEach(detach);
		}
	}

	function construct_svelte_component(component, props) {
		return new component(props);
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	/**
	 * Schedules a callback to run immediately before the component is unmounted.
	 *
	 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
	 * only one that runs inside a server-side component.
	 *
	 * https://svelte.dev/docs/svelte#ondestroy
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	/**
	 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
	 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
	 *
	 * Component events created with `createEventDispatcher` create a
	 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
	 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
	 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
	 * property and can contain any type of data.
	 *
	 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
	 * ```ts
	 * const dispatch = createEventDispatcher<{
	 *  loaded: never; // does not take a detail argument
	 *  change: string; // takes a detail argument of type string, which is required
	 *  optional: number | null; // takes an optional detail argument of type number
	 * }>();
	 * ```
	 *
	 * https://svelte.dev/docs/svelte#createeventdispatcher
	 * @template {Record<string, any>} [EventMap=any]
	 * @returns {import('./public.js').EventDispatcher<EventMap>}
	 */
	function createEventDispatcher() {
		const component = get_current_component();
		return (type, detail, { cancelable = false } = {}) => {
			const callbacks = component.$$.callbacks[type];
			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
				callbacks.slice().forEach((fn) => {
					fn.call(component, event);
				});
				return !event.defaultPrevented;
			}
			return true;
		};
	}

	/**
	 * Associates an arbitrary `context` object with the current component and the specified `key`
	 * and returns that object. The context is then available to children of the component
	 * (including slotted content) with `getContext`.
	 *
	 * Like lifecycle functions, this must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#setcontext
	 * @template T
	 * @param {any} key
	 * @param {T} context
	 * @returns {T}
	 */
	function setContext(key, context) {
		get_current_component().$$.context.set(key, context);
		return context;
	}

	/**
	 * Retrieves the context that belongs to the closest parent component with the specified `key`.
	 * Must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#getcontext
	 * @template T
	 * @param {any} key
	 * @returns {T}
	 */
	function getContext(key) {
		return get_current_component().$$.context.get(key);
	}

	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	/**
	 * @param component
	 * @param event
	 * @returns {void}
	 */
	function bubble(component, event) {
		const callbacks = component.$$.callbacks[event.type];
		if (callbacks) {
			// @ts-ignore
			callbacks.slice().forEach((fn) => fn.call(this, event));
		}
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {Promise<void>} */
	function tick() {
		schedule_update();
		return resolved_promise;
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function outro_and_destroy_block(block, lookup) {
		transition_out(block, 1, 1, () => {
			lookup.delete(block.key);
		});
	}

	/** @returns {any[]} */
	function update_keyed_each(
		old_blocks,
		dirty,
		get_key,
		dynamic,
		ctx,
		list,
		lookup,
		node,
		destroy,
		create_each_block,
		next,
		get_context
	) {
		let o = old_blocks.length;
		let n = list.length;
		let i = o;
		const old_indexes = {};
		while (i--) old_indexes[old_blocks[i].key] = i;
		const new_blocks = [];
		const new_lookup = new Map();
		const deltas = new Map();
		const updates = [];
		i = n;
		while (i--) {
			const child_ctx = get_context(ctx, list, i);
			const key = get_key(child_ctx);
			let block = lookup.get(key);
			if (!block) {
				block = create_each_block(key, child_ctx);
				block.c();
			} else if (dynamic) {
				// defer updates until all the DOM shuffling is done
				updates.push(() => block.p(child_ctx, dirty));
			}
			new_lookup.set(key, (new_blocks[i] = block));
			if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
		}
		const will_move = new Set();
		const did_move = new Set();
		/** @returns {void} */
		function insert(block) {
			transition_in(block, 1);
			block.m(node, next);
			lookup.set(block.key, block);
			next = block.first;
			n--;
		}
		while (o && n) {
			const new_block = new_blocks[n - 1];
			const old_block = old_blocks[o - 1];
			const new_key = new_block.key;
			const old_key = old_block.key;
			if (new_block === old_block) {
				// do nothing
				next = new_block.first;
				o--;
				n--;
			} else if (!new_lookup.has(old_key)) {
				// remove old block
				destroy(old_block, lookup);
				o--;
			} else if (!lookup.has(new_key) || will_move.has(new_key)) {
				insert(new_block);
			} else if (did_move.has(old_key)) {
				o--;
			} else if (deltas.get(new_key) > deltas.get(old_key)) {
				did_move.add(new_key);
				insert(new_block);
			} else {
				will_move.add(old_key);
				o--;
			}
		}
		while (o--) {
			const old_block = old_blocks[o];
			if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
		}
		while (n) insert(new_blocks[n - 1]);
		run_all(updates);
		return new_blocks;
	}

	/** @returns {{}} */
	function get_spread_update(levels, updates) {
		const update = {};
		const to_null_out = {};
		const accounted_for = { $$scope: 1 };
		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];
			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}
				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}
				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}
		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}
		return update;
	}

	function get_spread_object(spread_props) {
		return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify
	const PUBLIC_VERSION = '4';

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	const subscriber_queue = [];

	/**
	 * Creates a `Readable` store that allows reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#readable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function readable(value, start) {
		return {
			subscribe: writable(value, start).subscribe
		};
	}

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
					}
					if (run_queue) {
						for (let i = 0; i < subscriber_queue.length; i += 2) {
							subscriber_queue[i][0](subscriber_queue[i + 1]);
						}
						subscriber_queue.length = 0;
					}
				}
			}
		}

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
					stop();
					stop = null;
				}
			};
		}
		return { set, update, subscribe };
	}

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>, set: (value: T) => void, update: (fn: import('./public.js').Updater<T>) => void) => import('./public.js').Unsubscriber | void} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>) => T} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @param {S} stores
	 * @param {Function} fn
	 * @param {T} [initial_value]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function derived(stores, fn, initial_value) {
		const single = !Array.isArray(stores);
		/** @type {Array<import('./public.js').Readable<any>>} */
		const stores_array = single ? [stores] : stores;
		if (!stores_array.every(Boolean)) {
			throw new Error('derived() expects stores as input, got a falsy value');
		}
		const auto = fn.length < 2;
		return readable(initial_value, (set, update) => {
			let started = false;
			const values = [];
			let pending = 0;
			let cleanup = noop;
			const sync = () => {
				if (pending) {
					return;
				}
				cleanup();
				const result = fn(single ? values[0] : values, set, update);
				if (auto) {
					set(result);
				} else {
					cleanup = is_function(result) ? result : noop;
				}
			};
			const unsubscribers = stores_array.map((store, i) =>
				subscribe(
					store,
					(value) => {
						values[i] = value;
						pending &= ~(1 << i);
						if (started) {
							sync();
						}
					},
					() => {
						pending |= 1 << i;
					}
				)
			);
			started = true;
			sync();
			return function stop() {
				run_all(unsubscribers);
				cleanup();
				// We need to set this to false because callbacks can still happen despite having unsubscribed:
				// Callbacks might already be placed in the queue which doesn't know it should no longer
				// invoke this derived store.
				started = false;
			};
		});
	}

	function createEntityStore() {
	    const { subscribe, set, update } = writable({ ids: [], entities: {} });
	    return {
	        set,
	        _update: update,
	        subscribe,
	        add: (item) => update(({ ids, entities }) => ({
	            ids: [...ids, item.model.id],
	            entities: {
	                ...entities,
	                [item.model.id]: item
	            }
	        })),
	        delete: (id) => update(state => {
	            const { [id]: _, ...entities } = state.entities;
	            return {
	                ids: state.ids.filter(i => i !== id),
	                entities
	            };
	        }),
	        deleteAll: (ids) => update(state => {
	            const entities = { ...state.entities };
	            const idSet = new Set(ids);
	            for (let i = 0; i < state.ids.length; i++) {
	                if (idSet.has(state.ids[i])) {
	                    delete entities[state.ids[i]];
	                }
	            }
	            return {
	                ids: state.ids.filter(i => !idSet.has(i)),
	                entities
	            };
	        }),
	        update: (item) => update(({ ids, entities }) => ({
	            ids,
	            entities: {
	                ...entities,
	                [item.model.id]: item
	            }
	        })),
	        upsert: (item) => update(({ ids, entities }) => {
	            const hasIndex = ids.indexOf(item.model.id) !== -1;
	            return {
	                ids: hasIndex ? ids : [...ids, item.model.id],
	                entities: {
	                    ...entities,
	                    [item.model.id]: item
	                }
	            };
	        }),
	        upsertAll: (items) => update(state => {
	            const entities = { ...state.entities };
	            const ids = [...state.ids];
	            for (let i = 0; i < items.length; i++) {
	                if (ids.indexOf(items[i].model.id) === -1) {
	                    ids.push(items[i].model.id);
	                }
	                entities[items[i].model.id] = items[i];
	            }
	            return {
	                ids,
	                entities
	            };
	        }),
	        addAll: (items) => {
	            const ids = [];
	            const entities = {};
	            for (let i = 0; i < items.length; i++) {
	                ids.push(items[i].model.id);
	                entities[items[i].model.id] = items[i];
	            }
	            set({ ids, entities });
	        },
	        refresh: () => update(store => ({ ...store }))
	    };
	}
	function all(store) {
	    return derived(store, ({ ids, entities }) => {
	        const results = [];
	        for (let i = 0; i < ids.length; i++) {
	            results.push(entities[ids[i]]);
	        }
	        return results;
	    });
	}
	function createDataStore() {
	    const taskStore = createEntityStore();
	    const rowStore = createEntityStore();
	    const timeRangeStore = createEntityStore();
	    const allTasks = all(taskStore);
	    const allRows = all(rowStore);
	    const allTimeRanges = all(timeRangeStore);
	    const rowTaskCache = derived(allTasks, $allTasks => {
	        const cache = {};
	        for (let i = 0; i < $allTasks.length; i++) {
	            const task = $allTasks[i];
	            if (!cache[task.model.resourceId]) {
	                cache[task.model.resourceId] = [];
	            }
	            cache[task.model.resourceId].push(task.model.id);
	        }
	        return cache;
	    });
	    return {
	        taskStore,
	        rowStore,
	        timeRangeStore,
	        allTasks,
	        allRows,
	        allTimeRanges,
	        rowTaskCache
	    };
	}

	function isLeftClick(event) {
	    return event.which === 1;
	}
	/**
	 * Gets mouse position within an element
	 * @param node
	 * @param event
	 */
	function getRelativePos(node, event) {
	    const rect = node.getBoundingClientRect();
	    const x = event.clientX - rect.left; //x position within the element.
	    const y = event.clientY - rect.top; //y position within the element.
	    return {
	        x: x,
	        y: y
	    };
	}
	function getRelativePosition(node, event) {
	    const rect = node.getBoundingClientRect();
	    const x = event.clientX - rect.left; //x position within the element.
	    const y = event.clientY - rect.top; //y position within the element.
	    return [x, y];
	}
	/**
	 * Adds an event listener that triggers once.
	 * @param target
	 * @param type
	 * @param listener
	 * @param addOptions
	 * @param removeOptions
	 */
	function addEventListenerOnce(target, type, listener, addOptions, removeOptions) {
	    target.addEventListener(type, function fn() {
	        target.removeEventListener(type, fn, removeOptions);
	        listener.apply(this, arguments, addOptions);
	    });
	}
	/**
	 * Sets the cursor on an element. Globally by default.
	 * @param cursor
	 * @param node
	 */
	function setCursor(cursor, node = document.body) {
	    node.style.cursor = cursor;
	}
	function normalizeClassAttr(classes) {
	    if (!classes) {
	        return '';
	    }
	    if (typeof classes === 'string') {
	        return classes;
	    }
	    if (Array.isArray(classes)) {
	        return classes.join(' ');
	    }
	    return '';
	}
	function throttle(func, limit) {
	    let wait = false;
	    return function () {
	        if (!wait) {
	            func.apply(null, arguments);
	            wait = true;
	            setTimeout(function () {
	                wait = false;
	            }, limit);
	        }
	    };
	}
	/** How much pixels near the bounds user has to drag to start scrolling */
	const DRAGGING_TO_SCROLL_TRESHOLD = 40;
	/** How much pixels does the view scroll when dragging */
	const DRAGGING_TO_SCROLL_DELTA = 40;
	function outOfBounds(event, rect) {
	    return {
	        left: event.clientX - rect.left < 0 + DRAGGING_TO_SCROLL_TRESHOLD,
	        top: event.clientY - rect.top < 0 + DRAGGING_TO_SCROLL_TRESHOLD,
	        right: event.clientX - rect.left > rect.width - DRAGGING_TO_SCROLL_TRESHOLD,
	        bottom: event.clientY - rect.top > rect.height - DRAGGING_TO_SCROLL_TRESHOLD
	    };
	}
	const scrollIfOutOfBounds = throttle((event, scrollable) => {
	    // throttle the following
	    const mainContainerRect = scrollable.getBoundingClientRect();
	    const bounds = outOfBounds(event, mainContainerRect);
	    if (bounds.left || bounds.right) {
	        // scroll left
	        scrollable.scrollTo({
	            left: scrollable.scrollLeft + (bounds.left ? -DRAGGING_TO_SCROLL_DELTA : DRAGGING_TO_SCROLL_DELTA),
	            behavior: 'smooth'
	        });
	    }
	    if (bounds.top || bounds.bottom) {
	        // scroll top
	        scrollable.scrollTo({
	            top: scrollable.scrollTop + (bounds.top ? -DRAGGING_TO_SCROLL_DELTA : DRAGGING_TO_SCROLL_DELTA),
	            behavior: 'smooth'
	        });
	    }
	}, 250);
	function getRowAtPoint(event) {
	    const elements = document.elementsFromPoint(event.clientX, event.clientY);
	    const rowElement = elements.find(element => !!element.getAttribute('data-row-id'));
	    if (rowElement !== undefined) {
	        const rowId = rowElement.getAttribute('data-row-id');
	        return rowId;
	    }
	    return null;
	}

	function createUtils(params) {
	    return {
	        /**
	         * Returns position of date on a line if from and to represent length of width
	         * @param {*} date
	         */
	        getPositionByDate(date) {
	            return getPositionByDate(date, params.from, params.to, params.width);
	        },
	        getDateByPosition(x) {
	            return getDateByPosition(x, params.from, params.to, params.width);
	        },
	        roundTo(date) {
	            if (params.dateAdapter) {
	                return params.dateAdapter.roundTo(date, params.magnetUnit, params.magnetOffset);
	            }
	            // this does not consider the timezone, rounds only to the UTC time
	            // let value = Math.round((date - 7200000) / params.magnetDuration) * params.magnetDuration;
	            // cases where rounding to day or timezone offset is not rounded, this won't work
	            return null;
	        }
	    };
	}
	function getPositionByDate(date, from, to, width) {
	    if (!date) {
	        return undefined;
	    }
	    const durationTo = date - from;
	    const durationToEnd = to - from;
	    return (durationTo / durationToEnd) * width;
	}
	function getDateByPosition(x, from, to, width) {
	    const durationTo = (x / width) * (to - from);
	    const dateAtPosition = from + durationTo;
	    return dateAtPosition;
	}
	// Returns the object on the left and right in an array using the given cmp function.
	// The compare function defined which property of the value to compare (e.g.: c => c.left)
	function getIndicesOnly(input, value, comparer, strict) {
	    let lo = -1;
	    let hi = input.length;
	    while (hi - lo > 1) {
	        const mid = Math.floor((lo + hi) / 2);
	        if (strict ? comparer(input[mid]) < value : comparer(input[mid]) <= value) {
	            lo = mid;
	        }
	        else {
	            hi = mid;
	        }
	    }
	    if (!strict && input[lo] !== undefined && comparer(input[lo]) === value) {
	        hi = lo;
	    }
	    return [lo, hi];
	}
	function get(input, value, comparer, strict) {
	    const res = getIndicesOnly(input, value, comparer, strict);
	    return [input[res[0]], input[res[1]]];
	}
	function isDraggable(item) {
	    return item.draggable ?? item.enableDragging ?? true;
	}
	function isResizable(item) {
	    return item.resizable ?? item.enableResize ?? true;
	}

	function styleInject(css, ref) {
	  if ( ref === void 0 ) ref = {};
	  var insertAt = ref.insertAt;

	  if (!css || typeof document === 'undefined') { return; }

	  var head = document.head || document.getElementsByTagName('head')[0];
	  var style = document.createElement('style');
	  style.type = 'text/css';

	  if (insertAt === 'top') {
	    if (head.firstChild) {
	      head.insertBefore(style, head.firstChild);
	    } else {
	      head.appendChild(style);
	    }
	  } else {
	    head.appendChild(style);
	  }

	  if (style.styleSheet) {
	    style.styleSheet.cssText = css;
	  } else {
	    style.appendChild(document.createTextNode(css));
	  }
	}

	var css_248z$e = ".sg-label-bottom.svelte-38aze4.svelte-38aze4{position:absolute;top:calc(100% + 10px);color:#888}.debug.svelte-38aze4.svelte-38aze4{position:absolute;top:-10px;right:0;font-size:8px;color:black}.sg-task.svelte-38aze4.svelte-38aze4{position:absolute;border-radius:2px;white-space:nowrap;transition:background-color 0.2s,\n            opacity 0.2s;pointer-events:all;touch-action:none}.sg-task-background.svelte-38aze4.svelte-38aze4{position:absolute;height:100%;top:0}.sg-task-content.svelte-38aze4.svelte-38aze4{position:absolute;height:100%;top:0;padding-left:14px;font-size:14px;display:flex;align-items:center;justify-content:flex-start;user-select:none}.sg-task.animating.svelte-38aze4.svelte-38aze4:not(.moving){transition:left 0.2s,\n            top 0.2s,\n            transform 0.2s,\n            background-color 0.2s,\n            width 0.2s,\n            height 0.2s}.sg-task--sticky.svelte-38aze4.svelte-38aze4:not(.moving){transition:left 0.2s,\n            top 0.2s,\n            transform 0.2s,\n            background-color 0.2s,\n            width 0.2s,\n            height 0.2s}.sg-task--sticky.svelte-38aze4>.sg-task-content.svelte-38aze4{position:sticky;left:0;max-width:100px}.sg-task.moving.svelte-38aze4.svelte-38aze4{z-index:10000;opacity:0.5}.sg-task.resize-enabled.svelte-38aze4.svelte-38aze4:hover::before{content:'';width:4px;height:50%;top:25%;position:absolute;border-style:solid;border-color:rgba(255, 255, 255, 0.5);cursor:ew-resize;margin-left:3px;left:0;border-width:0 1px;z-index:1}.sg-task.resize-enabled.svelte-38aze4.svelte-38aze4:hover::after{content:'';width:4px;height:50%;top:25%;position:absolute;border-style:solid;border-color:rgba(255, 255, 255, 0.5);cursor:ew-resize;margin-right:3px;right:0;border-width:0 1px;z-index:1}.sg-task-reflected.svelte-38aze4.svelte-38aze4{opacity:0.5}.sg-task-instant.svelte-38aze4.svelte-38aze4{width:2px !important;margin-left:-1px}.sg-task-background.svelte-38aze4.svelte-38aze4{background:rgba(0, 0, 0, 0.2)}.sg-task-default{color:white;background:rgb(116, 191, 255)}.sg-task-default:hover{background:rgb(98, 161, 216)}.sg-task-default.selected{background:rgb(69, 112, 150)}.sg-task-selected{outline:2px solid rgba(3, 169, 244, 0.5);outline-offset:3px;z-index:1}.sg-milestone.svelte-38aze4.svelte-38aze4{width:20px !important;min-width:40px;margin-left:-20px}.sg-task.sg-milestone.svelte-38aze4.svelte-38aze4{background:transparent}.sg-milestone.svelte-38aze4 .sg-milestone__diamond.svelte-38aze4{position:relative}.sg-milestone.svelte-38aze4 .sg-milestone__diamond.svelte-38aze4:before{position:absolute;top:0;left:50%;content:' ';height:28px;width:28px;transform-origin:0 0;transform:rotate(45deg)}.sg-milestone__diamond:before{background:rgb(116, 191, 255)}";
	styleInject(css_248z$e);

	/* src/entities/Task.svelte generated by Svelte v4.2.19 */

	function create_if_block_5$1(ctx) {
		let div;

		return {
			c() {
				div = element("div");
				attr(div, "class", "sg-milestone__diamond svelte-38aze4");
			},
			m(target, anchor) {
				insert(target, div, anchor);
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (59:4) {#if model.amountDone}
	function create_if_block_4$1(ctx) {
		let div;

		return {
			c() {
				div = element("div");
				attr(div, "class", "sg-task-background svelte-38aze4");
				set_style(div, "width", /*model*/ ctx[0].amountDone + "%");
			},
			m(target, anchor) {
				insert(target, div, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*model*/ 1) {
					set_style(div, "width", /*model*/ ctx[0].amountDone + "%");
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (67:8) {:else}
	function create_else_block$3(ctx) {
		let t_value = /*model*/ ctx[0].label + "";
		let t;

		return {
			c() {
				t = text(t_value);
			},
			m(target, anchor) {
				insert(target, t, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*model*/ 1 && t_value !== (t_value = /*model*/ ctx[0].label + "")) set_data(t, t_value);
			},
			d(detaching) {
				if (detaching) {
					detach(t);
				}
			}
		};
	}

	// (65:30) 
	function create_if_block_3$1(ctx) {
		let html_tag;
		let raw_value = /*taskContent*/ ctx[12](/*model*/ ctx[0]) + "";
		let html_anchor;

		return {
			c() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert(target, html_anchor, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*model*/ 1 && raw_value !== (raw_value = /*taskContent*/ ctx[12](/*model*/ ctx[0]) + "")) html_tag.p(raw_value);
			},
			d(detaching) {
				if (detaching) {
					detach(html_anchor);
					html_tag.d();
				}
			}
		};
	}

	// (63:8) {#if model.html}
	function create_if_block_2$1(ctx) {
		let html_tag;
		let raw_value = /*model*/ ctx[0].html + "";
		let html_anchor;

		return {
			c() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert(target, html_anchor, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*model*/ 1 && raw_value !== (raw_value = /*model*/ ctx[0].html + "")) html_tag.p(raw_value);
			},
			d(detaching) {
				if (detaching) {
					detach(html_anchor);
					html_tag.d();
				}
			}
		};
	}

	// (70:8) {#if model.showButton}
	function create_if_block_1$2(ctx) {
		let span;
		let raw_value = /*model*/ ctx[0].buttonHtml + "";
		let span_class_value;
		let mounted;
		let dispose;

		return {
			c() {
				span = element("span");
				attr(span, "class", span_class_value = "sg-task-button " + /*model*/ ctx[0].buttonClasses + " svelte-38aze4");
				attr(span, "role", "button");
				attr(span, "tabindex", "0");
			},
			m(target, anchor) {
				insert(target, span, anchor);
				span.innerHTML = raw_value;

				if (!mounted) {
					dispose = listen(span, "click", /*onClick*/ ctx[15]);
					mounted = true;
				}
			},
			p(ctx, dirty) {
				if (dirty & /*model*/ 1 && raw_value !== (raw_value = /*model*/ ctx[0].buttonHtml + "")) span.innerHTML = raw_value;
				if (dirty & /*model*/ 1 && span_class_value !== (span_class_value = "sg-task-button " + /*model*/ ctx[0].buttonClasses + " svelte-38aze4")) {
					attr(span, "class", span_class_value);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(span);
				}

				mounted = false;
				dispose();
			}
		};
	}

	// (83:4) {#if model.labelBottom}
	function create_if_block$6(ctx) {
		let span;
		let t_value = /*model*/ ctx[0].labelBottom + "";
		let t;

		return {
			c() {
				span = element("span");
				t = text(t_value);
				attr(span, "class", "sg-label-bottom svelte-38aze4");
			},
			m(target, anchor) {
				insert(target, span, anchor);
				append(span, t);
			},
			p(ctx, dirty) {
				if (dirty & /*model*/ 1 && t_value !== (t_value = /*model*/ ctx[0].labelBottom + "")) set_data(t, t_value);
			},
			d(detaching) {
				if (detaching) {
					detach(span);
				}
			}
		};
	}

	function create_fragment$f(ctx) {
		let div1;
		let t0;
		let t1;
		let div0;
		let t2;
		let t3;
		let div1_data_task_id_value;
		let div1_class_value;
		let taskElement_action;
		let mounted;
		let dispose;
		let if_block0 = /*model*/ ctx[0].type === 'milestone' && create_if_block_5$1();
		let if_block1 = /*model*/ ctx[0].amountDone && create_if_block_4$1(ctx);

		function select_block_type(ctx, dirty) {
			if (/*model*/ ctx[0].html) return create_if_block_2$1;
			if (/*taskContent*/ ctx[12]) return create_if_block_3$1;
			return create_else_block$3;
		}

		let current_block_type = select_block_type(ctx);
		let if_block2 = current_block_type(ctx);
		let if_block3 = /*model*/ ctx[0].showButton && create_if_block_1$2(ctx);
		let if_block4 = /*model*/ ctx[0].labelBottom && create_if_block$6(ctx);

		return {
			c() {
				div1 = element("div");
				if (if_block0) if_block0.c();
				t0 = space();
				if (if_block1) if_block1.c();
				t1 = space();
				div0 = element("div");
				if_block2.c();
				t2 = space();
				if (if_block3) if_block3.c();
				t3 = space();
				if (if_block4) if_block4.c();
				attr(div0, "class", "sg-task-content svelte-38aze4");
				attr(div1, "data-task-id", div1_data_task_id_value = /*model*/ ctx[0].id);
				attr(div1, "class", div1_class_value = "sg-task " + /*classes*/ ctx[9] + " svelte-38aze4");
				set_style(div1, "width", /*width*/ ctx[4] + "px");
				set_style(div1, "height", /*height*/ ctx[1] + "px");
				set_style(div1, "left", /*left*/ ctx[2] + "px");
				set_style(div1, "top", /*top*/ ctx[3] + "px");
				toggle_class(div1, "sg-milestone", /*model*/ ctx[0].type === 'milestone');
				toggle_class(div1, "moving", /*_moving*/ ctx[8]);
				toggle_class(div1, "animating", /*animating*/ ctx[6]);
				toggle_class(div1, "sg-task-reflected", /*reflected*/ ctx[5]);
				toggle_class(div1, "sg-task-selected", /*$selectedTasks*/ ctx[10][/*model*/ ctx[0].id]);
				toggle_class(div1, "resize-enabled", /*resizeEnabled*/ ctx[7]);
				toggle_class(div1, "sg-task--sticky", /*model*/ ctx[0].stickyLabel);
				toggle_class(div1, "sg-ignore-click", _ignoreClick);
				toggle_class(div1, "sg-task-instant", /*width*/ ctx[4] === 0);
			},
			m(target, anchor) {
				insert(target, div1, anchor);
				if (if_block0) if_block0.m(div1, null);
				append(div1, t0);
				if (if_block1) if_block1.m(div1, null);
				append(div1, t1);
				append(div1, div0);
				if_block2.m(div0, null);
				append(div0, t2);
				if (if_block3) if_block3.m(div0, null);
				append(div1, t3);
				if (if_block4) if_block4.m(div1, null);

				if (!mounted) {
					dispose = [
						action_destroyer(taskElement_action = /*taskElement*/ ctx[14].call(null, div1, /*model*/ ctx[0])),
						listen(div1, "pointerdown", /*pointerdown_handler*/ ctx[19])
					];

					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				if (/*model*/ ctx[0].type === 'milestone') {
					if (if_block0) ; else {
						if_block0 = create_if_block_5$1();
						if_block0.c();
						if_block0.m(div1, t0);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (/*model*/ ctx[0].amountDone) {
					if (if_block1) {
						if_block1.p(ctx, dirty);
					} else {
						if_block1 = create_if_block_4$1(ctx);
						if_block1.c();
						if_block1.m(div1, t1);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2.d(1);
					if_block2 = current_block_type(ctx);

					if (if_block2) {
						if_block2.c();
						if_block2.m(div0, t2);
					}
				}

				if (/*model*/ ctx[0].showButton) {
					if (if_block3) {
						if_block3.p(ctx, dirty);
					} else {
						if_block3 = create_if_block_1$2(ctx);
						if_block3.c();
						if_block3.m(div0, null);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}

				if (/*model*/ ctx[0].labelBottom) {
					if (if_block4) {
						if_block4.p(ctx, dirty);
					} else {
						if_block4 = create_if_block$6(ctx);
						if_block4.c();
						if_block4.m(div1, null);
					}
				} else if (if_block4) {
					if_block4.d(1);
					if_block4 = null;
				}

				if (dirty & /*model*/ 1 && div1_data_task_id_value !== (div1_data_task_id_value = /*model*/ ctx[0].id)) {
					attr(div1, "data-task-id", div1_data_task_id_value);
				}

				if (dirty & /*classes*/ 512 && div1_class_value !== (div1_class_value = "sg-task " + /*classes*/ ctx[9] + " svelte-38aze4")) {
					attr(div1, "class", div1_class_value);
				}

				if (dirty & /*width*/ 16) {
					set_style(div1, "width", /*width*/ ctx[4] + "px");
				}

				if (dirty & /*height*/ 2) {
					set_style(div1, "height", /*height*/ ctx[1] + "px");
				}

				if (dirty & /*left*/ 4) {
					set_style(div1, "left", /*left*/ ctx[2] + "px");
				}

				if (dirty & /*top*/ 8) {
					set_style(div1, "top", /*top*/ ctx[3] + "px");
				}

				if (taskElement_action && is_function(taskElement_action.update) && dirty & /*model*/ 1) taskElement_action.update.call(null, /*model*/ ctx[0]);

				if (dirty & /*classes, model*/ 513) {
					toggle_class(div1, "sg-milestone", /*model*/ ctx[0].type === 'milestone');
				}

				if (dirty & /*classes, _moving*/ 768) {
					toggle_class(div1, "moving", /*_moving*/ ctx[8]);
				}

				if (dirty & /*classes, animating*/ 576) {
					toggle_class(div1, "animating", /*animating*/ ctx[6]);
				}

				if (dirty & /*classes, reflected*/ 544) {
					toggle_class(div1, "sg-task-reflected", /*reflected*/ ctx[5]);
				}

				if (dirty & /*classes, $selectedTasks, model*/ 1537) {
					toggle_class(div1, "sg-task-selected", /*$selectedTasks*/ ctx[10][/*model*/ ctx[0].id]);
				}

				if (dirty & /*classes, resizeEnabled*/ 640) {
					toggle_class(div1, "resize-enabled", /*resizeEnabled*/ ctx[7]);
				}

				if (dirty & /*classes, model*/ 513) {
					toggle_class(div1, "sg-task--sticky", /*model*/ ctx[0].stickyLabel);
				}

				if (dirty & /*classes, _ignoreClick*/ 512) {
					toggle_class(div1, "sg-ignore-click", _ignoreClick);
				}

				if (dirty & /*classes, width*/ 528) {
					toggle_class(div1, "sg-task-instant", /*width*/ ctx[4] === 0);
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div1);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if_block2.d();
				if (if_block3) if_block3.d();
				if (if_block4) if_block4.d();
				mounted = false;
				run_all(dispose);
			}
		};
	}

	let _ignoreClick = false;

	function instance$f($$self, $$props, $$invalidate) {
		let classes;
		let $rowStore;
		let $selectedTasks;
		let { model } = $$props;
		let { height } = $$props;
		let { left } = $$props;
		let { top } = $$props;
		let { width } = $$props;
		let { reflected = false } = $$props;
		let { animating = true } = $$props;
		let { dragging = false } = $$props;
		let { resizing = false } = $$props;
		const { rowStore } = getContext('dataStore');
		component_subscribe($$self, rowStore, value => $$invalidate(18, $rowStore = value));
		const { taskContent, onTaskButtonClick, taskElementHook } = getContext('options');
		const { selectionManager } = getContext('services');
		const selectedTasks = selectionManager._selectedTasks;
		component_subscribe($$self, selectedTasks, value => $$invalidate(10, $selectedTasks = value));

		function taskElement(node, model) {
			if (taskElementHook) {
				return taskElementHook(node, model);
			}
		}

		function onClick(event) {
			if (onTaskButtonClick) {
				onTaskButtonClick(model, event);
			}
		}

		let resizeEnabled;
		let _moving;

		function pointerdown_handler(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('model' in $$props) $$invalidate(0, model = $$props.model);
			if ('height' in $$props) $$invalidate(1, height = $$props.height);
			if ('left' in $$props) $$invalidate(2, left = $$props.left);
			if ('top' in $$props) $$invalidate(3, top = $$props.top);
			if ('width' in $$props) $$invalidate(4, width = $$props.width);
			if ('reflected' in $$props) $$invalidate(5, reflected = $$props.reflected);
			if ('animating' in $$props) $$invalidate(6, animating = $$props.animating);
			if ('dragging' in $$props) $$invalidate(16, dragging = $$props.dragging);
			if ('resizing' in $$props) $$invalidate(17, resizing = $$props.resizing);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*model*/ 1) {
				$$invalidate(9, classes = model.classes
				? normalizeClassAttr(model.classes)
				: 'sg-task-default');
			}

			if ($$self.$$.dirty & /*$rowStore, model*/ 262145) {
				{
					const row = $rowStore.entities[model.resourceId];
					$$invalidate(7, resizeEnabled = model.type !== 'milestone' && row && isResizable(row.model) && isResizable(model));
				}
			}

			if ($$self.$$.dirty & /*dragging, resizing*/ 196608) {
				{
					$$invalidate(8, _moving = dragging || resizing);
				}
			}
		};

		return [
			model,
			height,
			left,
			top,
			width,
			reflected,
			animating,
			resizeEnabled,
			_moving,
			classes,
			$selectedTasks,
			rowStore,
			taskContent,
			selectedTasks,
			taskElement,
			onClick,
			dragging,
			resizing,
			$rowStore,
			pointerdown_handler
		];
	}

	class Task extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$f, create_fragment$f, safe_not_equal, {
				model: 0,
				height: 1,
				left: 2,
				top: 3,
				width: 4,
				reflected: 5,
				animating: 6,
				dragging: 16,
				resizing: 17
			});
		}
	}

	var css_248z$d = ".sg-row.svelte-7u5y5s{position:relative;width:100%;box-sizing:border-box}";
	styleInject(css_248z$d);

	/* src/entities/Row.svelte generated by Svelte v4.2.19 */

	function create_if_block$5(ctx) {
		let html_tag;
		let raw_value = /*row*/ ctx[0].model.contentHtml + "";
		let html_anchor;

		return {
			c() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert(target, html_anchor, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*row*/ 1 && raw_value !== (raw_value = /*row*/ ctx[0].model.contentHtml + "")) html_tag.p(raw_value);
			},
			d(detaching) {
				if (detaching) {
					detach(html_anchor);
					html_tag.d();
				}
			}
		};
	}

	function create_fragment$e(ctx) {
		let div;
		let div_class_value;
		let div_data_row_id_value;
		let if_block = /*row*/ ctx[0].model.contentHtml && create_if_block$5(ctx);

		return {
			c() {
				div = element("div");
				if (if_block) if_block.c();
				attr(div, "class", div_class_value = "sg-row " + /*classes*/ ctx[1] + " svelte-7u5y5s");
				attr(div, "data-row-id", div_data_row_id_value = /*row*/ ctx[0].model.id);
				set_style(div, "height", /*row*/ ctx[0].height + "px");
				toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[2] == /*row*/ ctx[0].model.id);
				toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[3] == /*row*/ ctx[0].model.id);
			},
			m(target, anchor) {
				insert(target, div, anchor);
				if (if_block) if_block.m(div, null);
			},
			p(ctx, [dirty]) {
				if (/*row*/ ctx[0].model.contentHtml) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$5(ctx);
						if_block.c();
						if_block.m(div, null);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (dirty & /*classes*/ 2 && div_class_value !== (div_class_value = "sg-row " + /*classes*/ ctx[1] + " svelte-7u5y5s")) {
					attr(div, "class", div_class_value);
				}

				if (dirty & /*row*/ 1 && div_data_row_id_value !== (div_data_row_id_value = /*row*/ ctx[0].model.id)) {
					attr(div, "data-row-id", div_data_row_id_value);
				}

				if (dirty & /*row*/ 1) {
					set_style(div, "height", /*row*/ ctx[0].height + "px");
				}

				if (dirty & /*classes, $hoveredRow, row*/ 7) {
					toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[2] == /*row*/ ctx[0].model.id);
				}

				if (dirty & /*classes, $selectedRow, row*/ 11) {
					toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[3] == /*row*/ ctx[0].model.id);
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				if (if_block) if_block.d();
			}
		};
	}

	function instance$e($$self, $$props, $$invalidate) {
		let classes;
		let $hoveredRow;
		let $selectedRow;
		let { row } = $$props;
		const { hoveredRow, selectedRow } = getContext('gantt');
		component_subscribe($$self, hoveredRow, value => $$invalidate(2, $hoveredRow = value));
		component_subscribe($$self, selectedRow, value => $$invalidate(3, $selectedRow = value));

		$$self.$$set = $$props => {
			if ('row' in $$props) $$invalidate(0, row = $$props.row);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*row*/ 1) {
				$$invalidate(1, classes = normalizeClassAttr(row.model.classes));
			}
		};

		return [row, classes, $hoveredRow, $selectedRow, hoveredRow, selectedRow];
	}

	class Row extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$e, create_fragment$e, safe_not_equal, { row: 0 });
		}
	}

	var css_248z$c = ".sg-time-range.svelte-w7p5la{height:100%;position:absolute;display:flex;flex-direction:column;align-items:center;background-image:linear-gradient(\n            -45deg,\n            rgba(0, 0, 0, 0) 46%,\n            #e03218 49%,\n            #e03218 51%,\n            rgba(0, 0, 0, 0) 55%\n        );background-size:6px 6px !important;color:red;font-weight:400}.sg-time-range-label.svelte-w7p5la{margin-top:10px;background:#fff;white-space:nowrap;padding:4px;font-weight:400;font-size:10px}";
	styleInject(css_248z$c);

	/* src/entities/TimeRange.svelte generated by Svelte v4.2.19 */

	function create_if_block$4(ctx) {
		let div;
		let t_value = /*model*/ ctx[0].label + "";
		let t;

		return {
			c() {
				div = element("div");
				t = text(t_value);
				attr(div, "class", "sg-time-range-label svelte-w7p5la");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				append(div, t);
			},
			p(ctx, dirty) {
				if (dirty & /*model*/ 1 && t_value !== (t_value = /*model*/ ctx[0].label + "")) set_data(t, t_value);
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment$d(ctx) {
		let div;
		let div_class_value;
		let if_block = /*model*/ ctx[0].label && create_if_block$4(ctx);

		return {
			c() {
				div = element("div");
				if (if_block) if_block.c();
				attr(div, "class", div_class_value = "sg-time-range " + /*classes*/ ctx[4] + " svelte-w7p5la");
				set_style(div, "width", /*width*/ ctx[2] + "px");
				set_style(div, "left", /*left*/ ctx[1] + "px");
				toggle_class(div, "moving", /*resizing*/ ctx[3]);
			},
			m(target, anchor) {
				insert(target, div, anchor);
				if (if_block) if_block.m(div, null);
			},
			p(ctx, [dirty]) {
				if (/*model*/ ctx[0].label) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$4(ctx);
						if_block.c();
						if_block.m(div, null);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (dirty & /*classes*/ 16 && div_class_value !== (div_class_value = "sg-time-range " + /*classes*/ ctx[4] + " svelte-w7p5la")) {
					attr(div, "class", div_class_value);
				}

				if (dirty & /*width*/ 4) {
					set_style(div, "width", /*width*/ ctx[2] + "px");
				}

				if (dirty & /*left*/ 2) {
					set_style(div, "left", /*left*/ ctx[1] + "px");
				}

				if (dirty & /*classes, resizing*/ 24) {
					toggle_class(div, "moving", /*resizing*/ ctx[3]);
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				if (if_block) if_block.d();
			}
		};
	}

	function instance$d($$self, $$props, $$invalidate) {
		let classes;
		let { model } = $$props;
		let { left } = $$props;
		let { width } = $$props;
		let { resizing = false } = $$props;

		$$self.$$set = $$props => {
			if ('model' in $$props) $$invalidate(0, model = $$props.model);
			if ('left' in $$props) $$invalidate(1, left = $$props.left);
			if ('width' in $$props) $$invalidate(2, width = $$props.width);
			if ('resizing' in $$props) $$invalidate(3, resizing = $$props.resizing);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*model*/ 1) {
				$$invalidate(4, classes = normalizeClassAttr(model.classes));
			}
		};

		return [model, left, width, resizing, classes];
	}

	class TimeRange extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$d, create_fragment$d, safe_not_equal, { model: 0, left: 1, width: 2, resizing: 3 });
		}
	}

	const MIN_DRAG_X$1 = 2;
	const MIN_DRAG_Y$1 = 2;

	function getAccessor(accessor) {
	    if (accessor instanceof Function) {
	        return () => accessor();
	    }
	    else {
	        return () => accessor;
	    }
	}
	/**
	 * Applies dragging interaction to gantt elements
	 */
	function useDraggable(node, options) {
	    const onMousedown = createDraggable(options);
	    node.addEventListener('pointerdown', onMousedown);
	    return {
	        destroy() {
	            node.removeEventListener('pointerdown', onMousedown, false);
	        }
	    };
	}
	/**
	 * Applies dragging interaction to gantt elements
	 */
	function createDraggable(options) {
	    let mouseStartPosX;
	    let mouseStartPosY;
	    let mouseStartRight;
	    let direction;
	    let dragging = false;
	    let resizing = false;
	    let initialX;
	    let initialY;
	    let triggered = false;
	    const dragAllowed = getAccessor(options.dragAllowed);
	    const resizeAllowed = getAccessor(options.resizeAllowed);
	    function onMousedown(event) {
	        if (!isLeftClick(event)) {
	            return;
	        }
	        event.stopPropagation();
	        event.preventDefault();
	        const canDrag = dragAllowed();
	        const canResize = resizeAllowed();
	        if (!canDrag && !canResize) {
	            return;
	        }
	        const x = options.getX(event);
	        const y = options.getY(event);
	        const width = options.getWidth();
	        initialX = event.clientX;
	        initialY = event.clientY;
	        mouseStartRight = x + width;
	        mouseStartPosX = getRelativePos(options.container, event).x - x;
	        mouseStartPosY = getRelativePos(options.container, event).y - y;
	        if (canResize && mouseStartPosX <= options.resizeHandleWidth) {
	            direction = 'left';
	            resizing = true;
	        }
	        if (canResize && mouseStartPosX >= width - options.resizeHandleWidth) {
	            direction = 'right';
	            resizing = true;
	        }
	        if (canDrag && !resizing) {
	            dragging = true;
	        }
	        if ((dragging || resizing) && options.onDown) {
	            options.onDown({
	                mouseEvent: event,
	                x,
	                width,
	                y,
	                resizing: resizing,
	                dragging: dragging
	            });
	        }
	        window.addEventListener('pointermove', onMousemove, false);
	        addEventListenerOnce(window, 'pointerup', onMouseup);
	    }
	    function onMousemove(event) {
	        if (!triggered) {
	            if (Math.abs(event.clientX - initialX) > MIN_DRAG_X$1 ||
	                Math.abs(event.clientY - initialY) > MIN_DRAG_Y$1) {
	                triggered = true;
	            }
	            else {
	                return;
	            }
	        }
	        event.preventDefault();
	        if (resizing) {
	            const mousePos = getRelativePos(options.container, event);
	            const x = options.getX(event);
	            const width = options.getWidth();
	            let resultX;
	            let resultWidth;
	            if (direction === 'left') {
	                if (mouseStartRight - mousePos.x <= 0) {
	                    direction = 'right';
	                    resultX = mouseStartRight;
	                    resultWidth = mouseStartRight - mousePos.x;
	                    mouseStartRight = mouseStartRight + width;
	                }
	                else {
	                    resultX = mousePos.x;
	                    resultWidth = mouseStartRight - mousePos.x;
	                }
	            }
	            else if (direction === 'right') {
	                //resize right
	                if (mousePos.x - x <= 0) {
	                    direction = 'left';
	                    resultX = mousePos.x;
	                    resultWidth = mousePos.x - x;
	                    mouseStartRight = x;
	                }
	                else {
	                    resultX = x;
	                    resultWidth = mousePos.x - x;
	                }
	            }
	            if (options.onResize) {
	                options.onResize({
	                    x: resultX,
	                    width: resultWidth,
	                    event
	                });
	            }
	        }
	        // mouseup
	        if (dragging && options.onDrag) {
	            const mousePos = getRelativePos(options.container, event);
	            options.onDrag({
	                x: mousePos.x - mouseStartPosX, // maybe this is the rounding error
	                y: mousePos.y - mouseStartPosY,
	                event
	            });
	        }
	    }
	    function onMouseup(event) {
	        const x = options.getX(event);
	        const y = options.getY(event);
	        const width = options.getWidth();
	        options.onMouseUp && options.onMouseUp();
	        // there is an issue here maybe, we update task according to the mousemove event, but we ignore the mouseup event and use the previously commited x, y and width
	        // you know those issues when task gets rounded incorrectly on resize? could be the cause
	        // ....or not really, this issue results in task resizing when task is merely dragged
	        if (triggered && options.onDrop) {
	            options.onDrop({
	                mouseEvent: event,
	                x,
	                y,
	                width,
	                dragging: dragging,
	                resizing: resizing
	            });
	        }
	        mouseStartPosX = null;
	        mouseStartPosY = null;
	        mouseStartRight = null;
	        dragging = false;
	        resizing = false;
	        initialX = null;
	        initialY = null;
	        triggered = false;
	        window.removeEventListener('pointermove', onMousemove, false);
	    }
	    return onMousedown;
	}

	/* src/core/drag/DraggableGroup.svelte generated by Svelte v4.2.19 */
	const get_default_slot_changes$1 = dirty => ({});
	const get_default_slot_context$1 = ctx => ({ context: /*context*/ ctx[6] });

	function create_fragment$c(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[9].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context$1);

		return {
			c() {
				if (default_slot) default_slot.c();
			},
			m(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[8],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, get_default_slot_changes$1),
							get_default_slot_context$1
						);
					}
				}
			},
			i(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};
	}

	function instance$c($$self, $$props, $$invalidate) {
		let $rowPadding;
		let $rowStore;
		let $root;
		let $taskStore;
		let $_active;
		let $selectedTasks;
		let { $$slots: slots = {}, $$scope } = $$props;
		let { items = {} } = $$props;
		let _taskIds = [];
		const _active = writable(false);
		component_subscribe($$self, _active, value => $$invalidate(15, $_active = value));
		const root = writable({});
		component_subscribe($$self, root, value => $$invalidate(13, $root = value));
		const { taskStore, rowStore } = getContext('dataStore');
		component_subscribe($$self, taskStore, value => $$invalidate(14, $taskStore = value));
		component_subscribe($$self, rowStore, value => $$invalidate(12, $rowStore = value));
		const gantt = getContext('gantt');
		const { rowPadding } = getContext('options');
		component_subscribe($$self, rowPadding, value => $$invalidate(11, $rowPadding = value));
		const { api, utils, columnService, selectionManager } = getContext('services');
		const dispatcher = createEventDispatcher();
		const selectedTasks = selectionManager._selectedTasks;
		component_subscribe($$self, selectedTasks, value => $$invalidate(16, $selectedTasks = value));

		const context = {
			rootState: root,
			dragAllowed({ model }) {
				const row = $rowStore.entities[model.resourceId];
				return row && isDraggable(row.model) && isDraggable(model);
			},
			resizeAllowed({ model }) {
				const row = $rowStore.entities[model.resourceId];
				return model.type !== 'milestone' && row && isResizable(row.model) && isResizable(model);
			},
			off(taskId) {
				delete $root[taskId];
			},
			save(start, task, event) {
				// triggers onmousedown
				setCursor(event.dragging ? 'move' : 'e-resize');

				const { mouseEvent } = event;
				let tasks = [task];

				if (mouseEvent.ctrlKey) {
					for (const [taskId, isSelected] of Object.entries($selectedTasks)) {
						if (isSelected && taskId !== String(task.model.id)) {
							tasks.push($taskStore.entities[taskId]);
						}
					}
				}

				_taskIds = [];

				for (const task of tasks) {
					_taskIds.push(task.model.id);

					set_store_value(
						root,
						$root[task.model.id] = {
							xDelta: task.left - start.x,
							yDelta: task.top - start.y,
							width: task.width,
							bWidth: start.width,
							widthDelta: task.width - start.width
						},
						$root
					);
				}

				dispatcher('itemsChange', { items: $root });
			},
			dropAll(event) {
				if (!event.dragging && !event.resizing) {
					return;
				}

				set_store_value(_active, $_active = false, $_active);
				const changes = [];

				for (const taskId of _taskIds) {
					const state = $root[taskId];
					const task = $taskStore.entities[taskId];
					const isTarget = task.model.id === taskId;

					const change = onDropSingle(
						{
							...event,
							mouseEvent: {
								...event.mouseEvent,
								clientX: event.mouseEvent.clientX + state.xDelta,
								clientY: event.mouseEvent.clientY + state.yDelta
							},
							x: event.x + state.xDelta,
							y: event.y + state.yDelta,
							width: Math.abs((isTarget ? event.width : state.bWidth) + state.widthDelta)
						},
						task
					);

					changes.push({
						valid: change.valid,
						task: change.task,
						targetRow: change.targetRow,
						sourceRow: change.sourceRow,
						current: change.current,
						previous: change.previous
					});
				}

				dispatcher('change', { changes });
				set_store_value(root, $root = {}, $root);
				_taskIds = [];
				dispatcher('itemsChange', { items: $root });
			},
			moveAll({ x, y, width, event }, task, state) {
				scrollIfOutOfBounds(event, gantt.mainContainer);

				if (state.dragging) {
					api.tasks.raise.move(task.model);
				}

				if (state.resizing) {
					api.tasks.raise.resize(task.model);
				}

				for (const taskId of _taskIds) {
					// somehow update tasks to (event.x + xDelta, event.y + yDelta)
					const rootState = $root[taskId];

					const isTarget = task.model.id === taskId;

					const event = {
						x: x != null ? x + rootState.xDelta : null,
						y: y != null ? y + rootState.yDelta : null,
						width: width != null
						? Math.abs((isTarget ? width : rootState.bWidth) + rootState.widthDelta)
						: null, // pos.width + (width - pos.bWidth) // wDelta
						
					};

					set_store_value(
						root,
						$root[taskId] = {
							...$root[taskId],
							...state,
							x: event.x,
							y: event.y,
							width: event.width ?? $root[taskId]?.width
						},
						$root
					);
				}
			},
			setState(task, state) {
				set_store_value(root, $root[task.model.id] = { ...$root[task.model.id], ...state }, $root);
			},
			mouseUp({ model }) {
				setCursor('default');
				api.tasks.raise.moveEnd(model);
			}
		};

		// honestly keep state in context provider.
		function setState(state, id) {
			set_store_value(root, $root[id] = { ...$root[id], ...state }, $root);
		}

		function onDropSingle(event, task) {
			//row switching
			const model = task.model;

			const sourceRow = $rowStore.entities[model.resourceId];
			let targetRow;

			if (event.dragging) {
				const rowId = getRowAtPoint(event.mouseEvent);
				const row = $rowStore.entities[rowId];

				if (row && isDraggable(row.model)) {
					targetRow = row;
				}
			} else {
				// dont know about this
				targetRow = $rowStore.entities[model.resourceId]; // target row can be null
			}

			setState({ dragging: false, resizing: false }, model.id);

			setTimeout(() => {
				// sets state after it has been cleared, also resulting in a wierd render
				setState({ ignoreClick: false }, model.id);
			});

			const newFrom = utils.roundTo(columnService.getDateByPosition(event.x));
			const newTo = utils.roundTo(columnService.getDateByPosition(event.x + event.width));
			const newLeft = columnService.getPositionByDate(newFrom) | 0;
			const newRight = columnService.getPositionByDate(newTo) | 0;
			const left = newLeft;
			const width = newRight - newLeft;
			const top = $rowPadding + (targetRow?.y ?? 0);

			// get value of top from the layout
			const current = {
				left,
				top,
				width,
				from: newFrom,
				to: newTo
			};

			const previous = {
				left: task.left,
				width: task.width,
				top: task.top,
				from: model.from,
				to: model.to
			};

			return {
				valid: true,
				task,
				current,
				previous,
				dragging: event.dragging,
				resizing: event.resizing,
				sourceRow,
				targetRow
			};
		}

		setContext('drag', context);

		$$self.$$set = $$props => {
			if ('items' in $$props) $$invalidate(7, items = $$props.items);
			if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*items*/ 128) {
				set_store_value(root, $root = items, $root);
			}
		};

		return [
			_active,
			root,
			taskStore,
			rowStore,
			rowPadding,
			selectedTasks,
			context,
			items,
			$$scope,
			slots
		];
	}

	class DraggableGroup extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$c, create_fragment$c, safe_not_equal, { items: 7 });
		}
	}

	/* src/core/drag/Draggable.svelte generated by Svelte v4.2.19 */
	const get_default_slot_changes = dirty => ({ state: dirty & /*_state*/ 1 });

	const get_default_slot_context = ctx => ({
		state: /*_state*/ ctx[0],
		onPointerDown: /*onPointerDown*/ ctx[2]
	});

	function create_fragment$b(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[14].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], get_default_slot_context);

		return {
			c() {
				if (default_slot) default_slot.c();
			},
			m(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope, _state*/ 8193)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[13],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[13])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[13], dirty, get_default_slot_changes),
							get_default_slot_context
						);
					}
				}
			},
			i(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};
	}

	function instance$b($$self, $$props, $$invalidate) {
		let state;
		let _dragging;
		let _resizing;
		let _state;
		let $root;
		let { $$slots: slots = {}, $$scope } = $$props;
		let { task } = $$props;
		let _x;
		let _y;
		let _width;
		const { rowContainer, mainContainer } = getContext('gantt');
		const { resizeHandleWidth } = getContext('options');
		const context = getContext('drag');
		const root = context.rootState;
		component_subscribe($$self, root, value => $$invalidate(12, $root = value));
		const dragAllowed = null;
		const resizeAllowed = null;

		const onPointerDown = createDraggable({
			container: rowContainer,
			resizeHandleWidth,
			getX: () => _x,
			getY: () => _y,
			getWidth: () => _width,
			dragAllowed() {
				const fn = context.dragAllowed ?? (() => true);
				return fn(task);
			},
			resizeAllowed() {
				const fn = context.resizeAllowed ?? (() => true);
				return fn(task);
			},
			onDown(event) {
				context.save(event, task, event);
			},
			onMouseUp() {
				context.mouseUp(task);
			},
			onResize(event) {
				context.moveAll(event, task, {
					x: event.x,
					y: event.width,
					resizing: true,
					ignoreClick: true
				});
			},
			onDrag(event) {
				context.moveAll(event, task, {
					x: event.x,
					y: event.y,
					dragging: true,
					ignoreClick: true
				});

				scrollIfOutOfBounds(event.event, mainContainer);
			},
			onDrop(event) {
				context.dropAll(event);
			}
		});

		onDestroy(() => {
			context.off(task.model.id);
		});

		$$self.$$set = $$props => {
			if ('task' in $$props) $$invalidate(3, task = $$props.task);
			if ('$$scope' in $$props) $$invalidate(13, $$scope = $$props.$$scope);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*$root, task*/ 4104) {
				$$invalidate(9, state = $root[task.model.id]);
			}

			if ($$self.$$.dirty & /*state*/ 512) {
				$$invalidate(11, _dragging = state?.dragging ?? false);
			}

			if ($$self.$$.dirty & /*state*/ 512) {
				$$invalidate(10, _resizing = state?.resizing ?? false);
			}

			if ($$self.$$.dirty & /*state*/ 512) {
				state?.ignoreClick ?? false;
			}

			if ($$self.$$.dirty & /*_dragging, _resizing, state, task*/ 3592) {
				{
					if (_dragging || _resizing) {
						$$invalidate(6, _x = state?.x ?? task.left);
						$$invalidate(7, _y = state?.y ?? task.top);
						$$invalidate(8, _width = state?.width ?? task.width);
					} else {
						$$invalidate(6, _x = task.left);
						$$invalidate(7, _y = task.top);
						$$invalidate(8, _width = task.width);
					}
				}
			}

			if ($$self.$$.dirty & /*_x, _y, _width, _dragging, _resizing*/ 3520) {
				$$invalidate(0, _state = {
					x: _x,
					y: _y,
					width: _width,
					dragging: _dragging,
					resizing: _resizing
				});
			}
		};

		return [
			_state,
			root,
			onPointerDown,
			task,
			dragAllowed,
			resizeAllowed,
			_x,
			_y,
			_width,
			state,
			_resizing,
			_dragging,
			$root,
			$$scope,
			slots
		];
	}

	class Draggable extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$b, create_fragment$b, safe_not_equal, {
				task: 3,
				dragAllowed: 4,
				resizeAllowed: 5
			});
		}

		get dragAllowed() {
			return this.$$.ctx[4];
		}

		get resizeAllowed() {
			return this.$$.ctx[5];
		}
	}

	var css_248z$b = ".sg-time-range-control.svelte-w4nglp{position:absolute}.sg-time-range-handle-left.svelte-w4nglp{position:absolute;left:0}.sg-time-range-handle-right.svelte-w4nglp{position:absolute;right:0}.sg-time-range-disabled.svelte-w4nglp{display:none}.sg-time-range-handle-left.svelte-w4nglp::before,.sg-time-range-handle-right.svelte-w4nglp::before{position:absolute;content:'';bottom:4px;border-radius:6px 6px 6px 0;border:2px solid #b0b0b7;width:9px;height:9px;transform:translateX(-50%) rotate(-45deg);background-color:#fff;border-color:#e03218;cursor:ew-resize}";
	styleInject(css_248z$b);

	/* src/entities/TimeRangeHeader.svelte generated by Svelte v4.2.19 */

	function create_fragment$a(ctx) {
		let div2;
		let div0;
		let t;
		let div1;
		let div2_class_value;
		let mounted;
		let dispose;

		return {
			c() {
				div2 = element("div");
				div0 = element("div");
				t = space();
				div1 = element("div");
				attr(div0, "class", "sg-time-range-handle-left svelte-w4nglp");
				attr(div1, "class", "sg-time-range-handle-right svelte-w4nglp");
				attr(div2, "class", div2_class_value = "sg-time-range-control " + /*classes*/ ctx[2] + " svelte-w4nglp");
				set_style(div2, "width", /*_position*/ ctx[1].width + "px");
				set_style(div2, "left", /*_position*/ ctx[1].x + "px");
				toggle_class(div2, "sg-time-range-disabled", !isResizable(/*model*/ ctx[0]));
			},
			m(target, anchor) {
				insert(target, div2, anchor);
				append(div2, div0);
				append(div2, t);
				append(div2, div1);

				if (!mounted) {
					dispose = [
						action_destroyer(/*drag*/ ctx[3].call(null, div0)),
						action_destroyer(/*drag*/ ctx[3].call(null, div1))
					];

					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*classes*/ 4 && div2_class_value !== (div2_class_value = "sg-time-range-control " + /*classes*/ ctx[2] + " svelte-w4nglp")) {
					attr(div2, "class", div2_class_value);
				}

				if (dirty & /*_position*/ 2) {
					set_style(div2, "width", /*_position*/ ctx[1].width + "px");
				}

				if (dirty & /*_position*/ 2) {
					set_style(div2, "left", /*_position*/ ctx[1].x + "px");
				}

				if (dirty & /*classes, model*/ 5) {
					toggle_class(div2, "sg-time-range-disabled", !isResizable(/*model*/ ctx[0]));
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div2);
				}

				mounted = false;
				run_all(dispose);
			}
		};
	}

	function instance$a($$self, $$props, $$invalidate) {
		const { rowContainer } = getContext('gantt');
		const { api, utils, columnService } = getContext('services');
		const { resizeHandleWidth } = getContext('options');
		const { timeRangeStore } = getContext('dataStore');
		let { model } = $$props;
		let { width } = $$props;
		let { left } = $$props;
		const _position = { width, x: left };

		function drag(node) {
			const ondrop = event => {
				const newFrom = utils.roundTo(columnService.getDateByPosition(event.x));
				const newTo = utils.roundTo(columnService.getDateByPosition(event.x + event.width));
				const newLeft = columnService.getPositionByDate(newFrom);
				const newRight = columnService.getPositionByDate(newTo);
				Object.assign(model, { from: newFrom, to: newTo });

				update({
					left: newLeft,
					width: newRight - newLeft,
					model,
					resizing: false
				});

				api.timeranges.raise.changed({ model, left: event.x, width: event.width });
				window.removeEventListener('pointermove', onmousemove, false);
			};

			function update(state) {
				timeRangeStore.update(state);
				$$invalidate(1, _position.x = state.left, _position);
				$$invalidate(1, _position.width = state.width, _position);
			}

			const draggable = useDraggable(node, {
				onDown: event => {
					api.timeranges.raise.clicked({ model });

					update({
						left: event.x,
						width: event.width,
						model,
						resizing: true
					});
				},
				onResize: event => {
					api.timeranges.raise.resized({ model, left: event.x, width: event.width });

					update({
						left: event.x,
						width: event.width,
						model,
						resizing: true
					});
				},
				dragAllowed: false,
				resizeAllowed: () => isResizable(model),
				onDrop: ondrop,
				container: rowContainer,
				resizeHandleWidth,
				getX: () => _position.x,
				getY: () => 0,
				getWidth: () => _position.width
			});

			return { destroy: () => draggable.destroy() };
		}

		let classes;

		$$self.$$set = $$props => {
			if ('model' in $$props) $$invalidate(0, model = $$props.model);
			if ('width' in $$props) $$invalidate(4, width = $$props.width);
			if ('left' in $$props) $$invalidate(5, left = $$props.left);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*left, width*/ 48) {
				{
					($$invalidate(1, _position.x = left, _position), $$invalidate(1, _position.width = width, _position));
				}
			}

			if ($$self.$$.dirty & /*model*/ 1) {
				{
					$$invalidate(2, classes = normalizeClassAttr(model.classes));
				}
			}
		};

		return [model, _position, classes, drag, width, left];
	}

	class TimeRangeHeader extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$a, create_fragment$a, safe_not_equal, { model: 0, width: 4, left: 5 });
		}
	}

	var css_248z$a = ".column.svelte-4fffin{position:absolute;height:100%;box-sizing:border-box}.column.svelte-4fffin{border-right:#efefef 1px solid}";
	styleInject(css_248z$a);

	function getDuration(unit, offset = 1) {
	    switch (unit) {
	        case 'y':
	        case 'year':
	            return offset * 31536000000;
	        case 'month':
	            return offset * 30 * 24 * 60 * 60 * 1000; // incorrect since months are of different durations
	        // 4 cases : 28 - 29 - 30 - 31
	        case 'week':
	            return offset * 7 * 24 * 60 * 60 * 1000;
	        case 'd':
	        case 'day':
	            return offset * 24 * 60 * 60 * 1000;
	        case 'h':
	        case 'hour':
	            return offset * 60 * 60 * 1000;
	        case 'm':
	        case 'minute':
	            return offset * 60 * 1000;
	        case 's':
	        case 'second':
	            return offset * 1000;
	        default:
	            throw new Error(`Unknown unit: ${unit}`);
	    }
	}
	function addSeconds(date, offset = 1) {
	    date.setSeconds(date.getSeconds() + offset);
	    return date;
	}
	function addMinutes(date, offset = 1) {
	    date.setMinutes(date.getMinutes() + offset);
	    return date;
	}
	function addHours(date, offset = 1) {
	    date.setHours(date.getHours() + offset);
	    return date;
	}
	function addDays(date, offset = 1) {
	    date.setDate(date.getDate() + offset);
	    date.setHours(0, 0, 0);
	    return date;
	}
	function addWeeks(date, offset = 1) {
	    const d = date;
	    const day = d.getDay();
	    const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
	    d.setDate(diff);
	    d.setHours(0, 0, 0);
	    d.setDate(d.getDate() + 7 * offset);
	    return d;
	}
	function addMonths(date, offset = 1) {
	    date.setMonth(date.getMonth() + offset);
	    date.setDate(1);
	    date.setHours(0, 0, 0);
	    return date;
	}
	function addYears(date, offset = 1) {
	    date.setFullYear(date.getFullYear() + offset);
	    date.setMonth(0);
	    date.setDate(1);
	    date.setHours(0, 0, 0);
	    return date;
	}
	function getNextDate(date, unit, offset) {
	    switch (unit) {
	        case 'y':
	        case 'year':
	            return addYears(date, offset);
	        case 'month':
	            return addMonths(date, offset);
	        case 'week':
	            return addWeeks(date, offset);
	        case 'd':
	        case 'day':
	            return addDays(date, offset);
	        case 'h':
	        case 'hour':
	            return addHours(date, offset);
	        case 'm':
	        case 'minute':
	            return addMinutes(date, offset);
	        case 's':
	        case 'second':
	            return addSeconds(date, offset);
	    }
	}
	const units = ['y', 'year', 'month', 'week', 'd', 'day', 'h', 'hour', 'm', 'minute', 's', 'second'];
	/**
	 *
	 * @param from Interval start
	 * @param to Interval end
	 * @param unit Column unit
	 * @param offset Column spacing
	 * @param highlightedDurations
	 * @returns
	 */
	function getAllPeriods(from, to, unit, offset = 1, highlightedDurations) {
	    if (units.indexOf(unit) !== -1) {
	        let tmsWorkOld = 0;
	        let interval_duration = 0;
	        const start = new Date(from); // Starts at hh:mm:ss
	        const dateWork = new Date(from);
	        let nextDate = getNextDate(dateWork, unit, offset);
	        let tmsWork = nextDate.getTime();
	        const firstDuration = nextDate.getTime() - from;
	        const all_periods = [
	            {
	                // start: start,
	                // end: nextDate,
	                from: from,
	                // from: startOf(from, unit), // incorrect if not circled down to the unit eg. 6:30
	                // TODO: think about offsetting the whole row, so for example if timeline starts at 6:30, the headers still show times for 6:00, 7:00 etc, and not 6:30, 7:30...
	                to: nextDate.getTime(),
	                duration: firstDuration,
	                // check whether duration is highlighted
	                isHighlighted: highlightedDurations && isUnitFraction(start, highlightedDurations)
	            }
	        ];
	        if (tmsWork < to) {
	            while (tmsWork < to) {
	                tmsWorkOld = tmsWork;
	                nextDate = getNextDate(new Date(tmsWork), unit, offset);
	                interval_duration = nextDate.getTime() - tmsWork;
	                all_periods.push({
	                    from: tmsWork,
	                    to: nextDate.getTime(),
	                    duration: interval_duration,
	                    //check whether duration is highlighted
	                    isHighlighted: highlightedDurations &&
	                        isUnitFraction(new Date(tmsWork), highlightedDurations)
	                });
	                tmsWork = nextDate.getTime();
	            }
	            const last_day_duration = to - tmsWorkOld;
	            all_periods[all_periods.length - 1].to = to;
	            all_periods[all_periods.length - 1].duration = last_day_duration;
	            // ToDo: there could be another option for hours, minutes, seconds based on pure math like in getPeriodDuration to optimise performance
	        }
	        return all_periods;
	    }
	    throw new Error(`Unknown unit: ${unit}`);
	}
	function isUnitFraction(localDate, highlightedDurations) {
	    // const localDate = new Date(timestamp * 1000);
	    let timeInUnit;
	    switch (highlightedDurations.unit) {
	        case 'm':
	        case 'minute':
	            timeInUnit = localDate.getMinutes();
	            return highlightedDurations.fractions.includes(timeInUnit);
	        case 'h':
	        case 'hour':
	            timeInUnit = localDate.getHours();
	            return highlightedDurations.fractions.includes(timeInUnit);
	        case 'd':
	        case 'day':
	            timeInUnit = localDate.getDay();
	            return highlightedDurations.fractions.includes(timeInUnit);
	        case 'week':
	            // getWeekNumber(localDate);
	            return highlightedDurations.fractions.includes(timeInUnit);
	        case 'dayinMonth':
	            timeInUnit = localDate.getDate();
	            return highlightedDurations.fractions.includes(timeInUnit);
	        case 'month':
	            timeInUnit = localDate.getMonth();
	            return highlightedDurations.fractions.includes(timeInUnit);
	        case 'y':
	        case 'year':
	            timeInUnit = localDate.getFullYear();
	            return highlightedDurations.fractions.includes(timeInUnit);
	        default:
	            throw new Error(`Invalid unit: ${highlightedDurations.unit}`);
	    }
	}

	var css_248z$9 = ".column-header-row.svelte-vfarxf.svelte-vfarxf{position:relative;white-space:nowrap;height:32px}.column-header-cell.svelte-vfarxf.svelte-vfarxf{position:absolute;height:100%;box-sizing:border-box;text-overflow:clip;text-align:center;display:inline-flex;justify-content:center;align-items:center;font-size:1em;font-size:14px;font-weight:300;transition:background 0.2s;cursor:pointer;user-select:none;border-right:#efefef 1px solid;border-bottom:#efefef 1px solid}.column-header-cell.svelte-vfarxf.svelte-vfarxf:hover{background:#f9f9f9}.column-header-cell.sticky.svelte-vfarxf>.column-header-cell-label.svelte-vfarxf{position:sticky;left:1rem}";
	styleInject(css_248z$9);

	/* src/column/ColumnHeaderRow.svelte generated by Svelte v4.2.19 */

	function get_each_context$6(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[13] = list[i];
		return child_ctx;
	}

	// (40:4) {#each header.columns as _header}
	function create_each_block$6(ctx) {
		let div1;
		let div0;
		let t0_value = (/*_header*/ ctx[13].label || 'N/A') + "";
		let t0;
		let t1;
		let mounted;
		let dispose;

		function click_handler() {
			return /*click_handler*/ ctx[10](/*_header*/ ctx[13]);
		}

		return {
			c() {
				div1 = element("div");
				div0 = element("div");
				t0 = text(t0_value);
				t1 = space();
				attr(div0, "class", "column-header-cell-label svelte-vfarxf");
				attr(div1, "class", "column-header-cell svelte-vfarxf");
				attr(div1, "role", "button");
				attr(div1, "tabindex", "0");
				set_style(div1, "left", /*_header*/ ctx[13].left + "px");
				set_style(div1, "width", /*_header*/ ctx[13].width + "px");
				toggle_class(div1, "sticky", /*header*/ ctx[0].sticky);
			},
			m(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, t0);
				append(div1, t1);

				if (!mounted) {
					dispose = listen(div1, "click", click_handler);
					mounted = true;
				}
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;
				if (dirty & /*header*/ 1 && t0_value !== (t0_value = (/*_header*/ ctx[13].label || 'N/A') + "")) set_data(t0, t0_value);

				if (dirty & /*header*/ 1) {
					set_style(div1, "left", /*_header*/ ctx[13].left + "px");
				}

				if (dirty & /*header*/ 1) {
					set_style(div1, "width", /*_header*/ ctx[13].width + "px");
				}

				if (dirty & /*header*/ 1) {
					toggle_class(div1, "sticky", /*header*/ ctx[0].sticky);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div1);
				}

				mounted = false;
				dispose();
			}
		};
	}

	function create_fragment$9(ctx) {
		let div;
		let each_value = ensure_array_like(/*header*/ ctx[0].columns);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
		}

		return {
			c() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(div, "class", "column-header-row svelte-vfarxf");
			},
			m(target, anchor) {
				insert(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*header, onHeaderClick*/ 17) {
					each_value = ensure_array_like(/*header*/ ctx[0].columns);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$6(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$6(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function instance$9($$self, $$props, $$invalidate) {
		let $width;
		let $to;
		let $from;
		const dispatch = createEventDispatcher();
		const { from, to, width } = getContext('dimensions');
		component_subscribe($$self, from, value => $$invalidate(9, $from = value));
		component_subscribe($$self, to, value => $$invalidate(8, $to = value));
		component_subscribe($$self, width, value => $$invalidate(7, $width = value));
		const { dateAdapter } = getContext('options');
		let { header } = $$props;
		let { ganttBodyColumns } = $$props;
		let { ganttBodyUnit } = $$props;

		function onHeaderClick(_header) {
			dispatch('dateSelected', {
				from: _header.from,
				to: _header.to,
				unit: header.unit
			});
		}

		const click_handler = _header => onHeaderClick(_header);

		$$self.$$set = $$props => {
			if ('header' in $$props) $$invalidate(0, header = $$props.header);
			if ('ganttBodyColumns' in $$props) $$invalidate(5, ganttBodyColumns = $$props.ganttBodyColumns);
			if ('ganttBodyUnit' in $$props) $$invalidate(6, ganttBodyUnit = $$props.ganttBodyUnit);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*header, ganttBodyUnit, ganttBodyColumns, $from, $to, $width*/ 993) {
				{
					if (header.unit === ganttBodyUnit) {
						$$invalidate(
							0,
							header.columns = ganttBodyColumns.map(column => ({
								...column,
								label: dateAdapter.format(column.from, header.format)
							})),
							header
						);
					} else {
						const periods = getAllPeriods($from.valueOf(), $to.valueOf(), header.unit, header.offset);
						let distance_point = 0;
						let left = 0;

						$$invalidate(
							0,
							header.columns = periods.map(period => {
								left = distance_point;
								distance_point = getPositionByDate(period.to, $from.valueOf(), $to.valueOf(), $width);

								return {
									width: Math.min(distance_point - left, $width),
									label: dateAdapter.format(period.from, header.format),
									from: period.from,
									to: period.to,
									left
								};
							}),
							header
						);
					}
				}
			}
		};

		return [
			header,
			from,
			to,
			width,
			onHeaderClick,
			ganttBodyColumns,
			ganttBodyUnit,
			$width,
			$to,
			$from,
			click_handler
		];
	}

	class ColumnHeaderRow extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$9, create_fragment$9, safe_not_equal, {
				header: 0,
				ganttBodyColumns: 5,
				ganttBodyUnit: 6
			});
		}
	}

	/* src/column/ColumnHeader.svelte generated by Svelte v4.2.19 */

	function get_each_context$5(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[4] = list[i];
		return child_ctx;
	}

	// (10:0) {#each headers as header}
	function create_each_block$5(ctx) {
		let columnheaderrow;
		let current;

		columnheaderrow = new ColumnHeaderRow({
				props: {
					header: /*header*/ ctx[4],
					ganttBodyColumns: /*ganttBodyColumns*/ ctx[1],
					ganttBodyUnit: /*ganttBodyUnit*/ ctx[2]
				}
			});

		columnheaderrow.$on("dateSelected", /*dateSelected_handler*/ ctx[3]);

		return {
			c() {
				create_component(columnheaderrow.$$.fragment);
			},
			m(target, anchor) {
				mount_component(columnheaderrow, target, anchor);
				current = true;
			},
			p(ctx, dirty) {
				const columnheaderrow_changes = {};
				if (dirty & /*headers*/ 1) columnheaderrow_changes.header = /*header*/ ctx[4];
				if (dirty & /*ganttBodyColumns*/ 2) columnheaderrow_changes.ganttBodyColumns = /*ganttBodyColumns*/ ctx[1];
				if (dirty & /*ganttBodyUnit*/ 4) columnheaderrow_changes.ganttBodyUnit = /*ganttBodyUnit*/ ctx[2];
				columnheaderrow.$set(columnheaderrow_changes);
			},
			i(local) {
				if (current) return;
				transition_in(columnheaderrow.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(columnheaderrow.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				destroy_component(columnheaderrow, detaching);
			}
		};
	}

	function create_fragment$8(ctx) {
		let each_1_anchor;
		let current;
		let each_value = ensure_array_like(/*headers*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		return {
			c() {
				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},
			m(target, anchor) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert(target, each_1_anchor, anchor);
				current = true;
			},
			p(ctx, [dirty]) {
				if (dirty & /*headers, ganttBodyColumns, ganttBodyUnit*/ 7) {
					each_value = ensure_array_like(/*headers*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$5(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$5(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function instance$8($$self, $$props, $$invalidate) {
		let { headers } = $$props;
		let { ganttBodyColumns } = $$props;
		let { ganttBodyUnit } = $$props;

		function dateSelected_handler(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('headers' in $$props) $$invalidate(0, headers = $$props.headers);
			if ('ganttBodyColumns' in $$props) $$invalidate(1, ganttBodyColumns = $$props.ganttBodyColumns);
			if ('ganttBodyUnit' in $$props) $$invalidate(2, ganttBodyUnit = $$props.ganttBodyUnit);
		};

		return [headers, ganttBodyColumns, ganttBodyUnit, dateSelected_handler];
	}

	class ColumnHeader extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$8, create_fragment$8, safe_not_equal, {
				headers: 0,
				ganttBodyColumns: 1,
				ganttBodyUnit: 2
			});
		}
	}

	function createBackground(columns, opts) {
	    try {
	        const canvas = document.createElement('canvas');
	        canvas.width = (columns.length - 1) * columns[0].width;
	        canvas.height = 20;
	        const ctx = canvas.getContext('2d');
	        ctx.shadowColor = 'rgba(128,128,128,0.5)';
	        ctx.shadowOffsetX = 0;
	        ctx.shadowOffsetY = 0;
	        ctx.shadowBlur = 0.5;
	        ctx.lineWidth = opts.columnStrokeWidth;
	        ctx.lineCap = 'square';
	        ctx.strokeStyle = opts.columnStrokeColor;
	        ctx.translate(0.5, 0.5);
	        columns.forEach(column => {
	            lineAt(ctx, column.left);
	        });
	        const dataURL = canvas.toDataURL();
	        return `url("${dataURL}")`;
	    }
	    catch (e) {
	        console.error('[canvas] Render error', e);
	    }
	}
	function lineAt(ctx, x) {
	    ctx.beginPath();
	    ctx.moveTo(x, 0);
	    ctx.lineTo(x, 20);
	    ctx.stroke();
	}

	var css_248z$8 = ".sg-columns.svelte-1uqfnup{position:absolute;height:100%;width:100%}.sg-columns--background.svelte-1uqfnup{overflow:hidden;background-repeat:repeat;background-position-x:-1px}.sg-column.svelte-1uqfnup{position:absolute;height:100%;width:100%;box-sizing:border-box}";
	styleInject(css_248z$8);

	/* src/column/Columns.svelte generated by Svelte v4.2.19 */

	function get_each_context$4(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[6] = list[i];
		return child_ctx;
	}

	// (24:0) {:else}
	function create_else_block$2(ctx) {
		let div;
		let each_value = ensure_array_like(/*columns*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
		}

		return {
			c() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(div, "class", "sg-columns svelte-1uqfnup");
			},
			m(target, anchor) {
				insert(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}
			},
			p(ctx, dirty) {
				if (dirty & /*columns, columnStrokeWidth, columnStrokeColor, columnDefaultColor*/ 29) {
					each_value = ensure_array_like(/*columns*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$4(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$4(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	// (22:0) {#if useCanvasColumns}
	function create_if_block$3(ctx) {
		let div;

		return {
			c() {
				div = element("div");
				attr(div, "class", "sg-columns sg-columns--background svelte-1uqfnup");
				set_style(div, "background-image", /*backgroundImage*/ ctx[5]);
			},
			m(target, anchor) {
				insert(target, div, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*backgroundImage*/ 32) {
					set_style(div, "background-image", /*backgroundImage*/ ctx[5]);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (26:8) {#each columns as column}
	function create_each_block$4(ctx) {
		let div;

		return {
			c() {
				div = element("div");
				attr(div, "class", "sg-column svelte-1uqfnup");

				set_style(div, "border-right", (/*column*/ ctx[6].bgHighlightColor
				? 0
				: /*columnStrokeWidth*/ ctx[2]) + "px solid " + (/*column*/ ctx[6].bgHighlightColor || /*columnStrokeColor*/ ctx[3]));

				set_style(div, "left", /*column*/ ctx[6].left + "px");
				set_style(div, "width", /*column*/ ctx[6].width + "px");
				set_style(div, "background-color", /*column*/ ctx[6].bgHighlightColor || /*columnDefaultColor*/ ctx[4]);
			},
			m(target, anchor) {
				insert(target, div, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*columns, columnStrokeWidth, columnStrokeColor*/ 13) {
					set_style(div, "border-right", (/*column*/ ctx[6].bgHighlightColor
					? 0
					: /*columnStrokeWidth*/ ctx[2]) + "px solid " + (/*column*/ ctx[6].bgHighlightColor || /*columnStrokeColor*/ ctx[3]));
				}

				if (dirty & /*columns*/ 1) {
					set_style(div, "left", /*column*/ ctx[6].left + "px");
				}

				if (dirty & /*columns*/ 1) {
					set_style(div, "width", /*column*/ ctx[6].width + "px");
				}

				if (dirty & /*columns, columnDefaultColor*/ 17) {
					set_style(div, "background-color", /*column*/ ctx[6].bgHighlightColor || /*columnDefaultColor*/ ctx[4]);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment$7(ctx) {
		let if_block_anchor;

		function select_block_type(ctx, dirty) {
			if (/*useCanvasColumns*/ ctx[1]) return create_if_block$3;
			return create_else_block$2;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		return {
			c() {
				if_block.c();
				if_block_anchor = empty();
			},
			m(target, anchor) {
				if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},
			p(ctx, [dirty]) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(if_block_anchor);
				}

				if_block.d(detaching);
			}
		};
	}

	function instance$7($$self, $$props, $$invalidate) {
		let { columns } = $$props;
		let { useCanvasColumns = true } = $$props;
		let { columnStrokeWidth } = $$props;
		let { columnStrokeColor } = $$props;
		let { columnDefaultColor = '#ffffff' } = $$props;
		let backgroundImage;

		$$self.$$set = $$props => {
			if ('columns' in $$props) $$invalidate(0, columns = $$props.columns);
			if ('useCanvasColumns' in $$props) $$invalidate(1, useCanvasColumns = $$props.useCanvasColumns);
			if ('columnStrokeWidth' in $$props) $$invalidate(2, columnStrokeWidth = $$props.columnStrokeWidth);
			if ('columnStrokeColor' in $$props) $$invalidate(3, columnStrokeColor = $$props.columnStrokeColor);
			if ('columnDefaultColor' in $$props) $$invalidate(4, columnDefaultColor = $$props.columnDefaultColor);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*columns, columnStrokeColor, columnStrokeWidth*/ 13) {
				{
					// TODO: background repeats and so do columns so passing every element is not needed, but line alignment issues occur on later rows
					// TODO: I used to make column widths and positions whole numbers, now they contain decimals again, check if this is because of that
					$$invalidate(5, backgroundImage = createBackground(columns, {
						// columns.slice(0,5)
						columnStrokeColor,
						columnStrokeWidth
					}));
				}
			}
		};

		return [
			columns,
			useCanvasColumns,
			columnStrokeWidth,
			columnStrokeColor,
			columnDefaultColor,
			backgroundImage
		];
	}

	class Columns extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$7, create_fragment$7, safe_not_equal, {
				columns: 0,
				useCanvasColumns: 1,
				columnStrokeWidth: 2,
				columnStrokeColor: 3,
				columnDefaultColor: 4
			});
		}
	}

	var css_248z$7 = ".sg-context-menu.svelte-1a9x2in{position:absolute;background:white;border:1px solid #ccc;padding:0.25em 0;font-size:10px;transition:opacity 0.4s ease 0s;opacity:1;box-shadow:rgba(0, 0, 0, 0.32) 1px 1px 3px 0px}.context-option.svelte-1a9x2in:hover{background:#eee}.context-option.svelte-1a9x2in{cursor:default;padding:0.2em 1em}";
	styleInject(css_248z$7);

	var css_248z$6 = ".sg-resize.svelte-1vzamdy{z-index:2;background:#e9eaeb;width:5px;cursor:col-resize;position:absolute;height:100%;transition:width 0.2s,\n            transform 0.2s}.sg-resize.svelte-1vzamdy:hover{transform:translateX(-2px);width:10px}";
	styleInject(css_248z$6);

	/* src/ui/Resizer.svelte generated by Svelte v4.2.19 */

	function create_fragment$6(ctx) {
		let div;
		let mounted;
		let dispose;

		return {
			c() {
				div = element("div");
				attr(div, "class", "sg-resize svelte-1vzamdy");
				set_style(div, "left", /*x*/ ctx[0] + "px");
			},
			m(target, anchor) {
				insert(target, div, anchor);

				if (!mounted) {
					dispose = action_destroyer(/*resizer*/ ctx[1].call(null, div));
					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*x*/ 1) {
					set_style(div, "left", /*x*/ ctx[0] + "px");
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				mounted = false;
				dispose();
			}
		};
	}

	function instance$6($$self, $$props, $$invalidate) {
		const dispatch = createEventDispatcher();
		let { x } = $$props;
		let { container } = $$props;

		const dragOptions = {
			onDrag: event => {
				($$invalidate(0, x = event.x));
				dispatch('resize', { left: x });
				setCursor('col-resize');
			},
			onDrop: event => {
				($$invalidate(0, x = event.x));
				dispatch('resize', { left: x });
				setCursor('default');
			},
			dragAllowed: true,
			resizeAllowed: false,
			container,
			getX: () => x,
			getY: () => 0,
			getWidth: () => 0
		};

		function resizer(node) {
			const draggable = useDraggable(node, dragOptions);
			return { destroy: () => draggable.destroy() };
		}

		$$self.$$set = $$props => {
			if ('x' in $$props) $$invalidate(0, x = $$props.x);
			if ('container' in $$props) $$invalidate(2, container = $$props.container);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*container*/ 4) {
				dragOptions.container = container;
			}
		};

		return [x, resizer, container];
	}

	class Resizer extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$6, create_fragment$6, safe_not_equal, { x: 0, container: 2 });
		}
	}

	function controller() {
	    const listeners = [];
	    function raise(...params) {
	        for (const listener of listeners) {
	            listener(params);
	        }
	    }
	    function on(handler) {
	        listeners.push(handler);
	        const removeListener = () => {
	            const index = listeners.indexOf(handler);
	            listeners.splice(index, 1);
	        };
	        return removeListener;
	    }
	    return [on, raise];
	}
	function feature(events) {
	    const result = { on: {}, raise: {} };
	    for (const event in events) {
	        const [on, raise] = events[event];
	        result.on[event] = on;
	        result.raise[event] = raise;
	    }
	    return result;
	}
	const contextKey = {};
	function provideGanttApi() {
	    return setContext(contextKey, createGanttApi());
	}
	function createGanttApi() {
	    return {
	        tasks: feature({
	            move: controller(),
	            resize: controller(),
	            select: controller(),
	            switchRow: controller(),
	            moveEnd: controller(),
	            change: controller(),
	            changed: controller(),
	            dblclicked: controller(),
	        }),
	        gantt: feature({
	            viewChanged: controller(),
	            dateSelected: controller(),
	        }),
	        timeranges: feature({
	            clicked: controller(),
	            resized: controller(),
	            changed: controller(),
	        }),
	    };
	}

	function createTaskFactory(params) {
	    return {
	        createTask: (model) => createTask(model, params),
	        reflectTask: (task, targetRow) => reflectTask(task, targetRow, params),
	    };
	}
	function createTask(model, params) {
	    model.amountDone = model.amountDone ?? 0;
	    model.showButton = model.showButton ?? false;
	    model.buttonClasses = model.buttonClasses ?? '';
	    model.buttonHtml = model.buttonHtml ?? '';
	    const left = params.getPositionByDate(model.from) | 0;
	    const right = params.getPositionByDate(model.to) | 0;
	    const row = params.rowEntities[model.resourceId];
	    const height = (row ? row.height : undefined) - 2 * params.rowPadding;
	    const top = (row ? row.y : -1000) + params.rowPadding;
	    return {
	        model,
	        left: left,
	        width: right - left,
	        height,
	        top,
	    };
	}
	function reflectTask(task, targetRow, params) {
	    const reflectedId = `reflected-task-${String(task.model.id)}-${String(targetRow.model.id)}`;
	    const model = {
	        ...task.model,
	        resourceId: targetRow.model.id,
	        id: reflectedId,
	        enableDragging: false
	    };
	    return {
	        ...task,
	        model,
	        top: targetRow.y + params.rowPadding,
	        reflected: true,
	        reflectedOnParent: false,
	        reflectedOnChild: true,
	        originalId: task.model.id
	    };
	}

	function createRows(rows, params) {
	    const context = { y: 0, result: [] };
	    createChildRows(rows, context, params);
	    return context.result;
	}
	function createChildRows(rowModels, context, params, parent = null, level = 0, parents = []) {
	    const rowsAtLevel = [];
	    const allRows = [];
	    if (parent) {
	        parents = [...parents, parent];
	    }
	    for (const model of rowModels) {
	        const row = createRow(model, context.y, params);
	        context.result.push(row);
	        rowsAtLevel.push(row);
	        allRows.push(row);
	        row.childLevel = level;
	        row.parent = parent;
	        row.allParents = parents;
	        if (parent) {
	            // when row is hidden, other rows (y-pos) move upward
	            row.hidden = !(parent.model.expanded || parent.model.expanded == null) || parent.hidden != null && parent.hidden;
	        }
	        if (!row.hidden) {
	            context.y += row.height;
	        }
	        if (model.children) {
	            const nextLevel = createChildRows(model.children, context, params, row, level + 1, parents);
	            row.children = nextLevel.rows;
	            row.allChildren = nextLevel.allRows;
	            allRows.push(...nextLevel.allRows);
	        }
	    }
	    return {
	        rows: rowsAtLevel,
	        allRows
	    };
	}
	function createRow(model, y, params) {
	    // defaults
	    // height of row element
	    const height = model.height ?? params.rowHeight;
	    return {
	        model: model,
	        y,
	        height,
	    };
	}
	function expandRow(row) {
	    row.model.expanded = true;
	    if (row.children)
	        show$1(row.children);
	}
	function collapseRow(row) {
	    row.model.expanded = false;
	    if (row.children)
	        hide$1(row.children);
	}
	function hide$1(children) {
	    for (const row of children) {
	        if (row.children)
	            hide$1(row.children);
	        row.hidden = true;
	    }
	}
	function show$1(children, hidden = false) {
	    for (const row of children) {
	        if (row.children)
	            show$1(row.children, !row.model.expanded);
	        row.hidden = hidden;
	    }
	}

	class TimeRangeFactory {
	    columnService;
	    constructor(columnService) {
	        this.columnService = columnService;
	    }
	    create(model) {
	        // enable dragging
	        model.resizable = model.resizable === undefined ? true : model.resizable;
	        const left = this.columnService.getPositionByDate(model.from);
	        const right = this.columnService.getPositionByDate(model.to);
	        return {
	            model,
	            left: left,
	            width: right - left,
	            resizing: false
	        };
	    }
	}

	class SelectionManager {
	    taskStore;
	    _selectedTasks = writable({});
	    constructor(taskStore) {
	        this.taskStore = taskStore;
	    }
	    selectSingle(taskId) {
	        this.unSelectTasks();
	        this._selectedTasks.set({ [taskId]: true });
	    }
	    toggleSelection(taskId) {
	        this._selectedTasks.update(selections => ({
	            ...selections,
	            [taskId]: !selections[taskId]
	        }));
	    }
	    unSelectTasks() {
	        this._selectedTasks.set({});
	    }
	}

	function createColumnService(params) {
	    function getColumnByDate(date) {
	        const pair = findByDate(params.columns, date);
	        return !pair[0] ? pair[1] : pair[0];
	    }
	    function getColumnByPosition(x) {
	        const pair = findByPosition(params.columns, x);
	        return !pair[0] ? pair[1] : pair[0];
	    }
	    return {
	        getColumnByDate,
	        getColumnByPosition,
	        getPositionByDate(date) {
	            if (!date)
	                return null;
	            const column = getColumnByDate(date);
	            let durationTo = date - column.from;
	            const position = (durationTo / column.duration) * column.width;
	            //multiples - skip every nth col, use other duration
	            return column.left + position;
	        },
	        getDateByPosition(x) {
	            const column = getColumnByPosition(x);
	            x = x - column.left;
	            let positionDuration = (column.duration / column.width) * x;
	            const date = column.from + positionDuration;
	            return date;
	        },
	        /**
	         * TODO: remove, currently unused
	         * @param {number} date - Date
	         * @returns {number} rounded date passed as parameter
	         */
	        roundTo(date) {
	            let value = Math.round(date / params.magnetDuration) * params.magnetDuration;
	            return value;
	        }
	    };
	}
	function findByPosition(columns, x) {
	    const result = get(columns, x, c => c.left);
	    return result;
	}
	function findByDate(columns, x) {
	    const result = get(columns, x, c => c.from);
	    return result;
	}

	function createDelegatedEventDispatcher() {
	    const callbacks = {};
	    return {
	        onDelegatedEvent(type, attr, callback) {
	            if (!callbacks[type])
	                callbacks[type] = {};
	            callbacks[type][attr] = callback;
	        },
	        offDelegatedEvent(type, attr) {
	            delete callbacks[type][attr];
	        },
	        onEvent(e) {
	            const { type, target } = e;
	            const cbs = callbacks[type];
	            if (!cbs)
	                return;
	            let match;
	            let element = target;
	            while (element && element != e.currentTarget) {
	                if ((match = matches(cbs, element))) {
	                    break;
	                }
	                element = element.parentElement;
	            }
	            if (match && cbs[match.attr]) {
	                cbs[match.attr](e, match.data, element);
	            }
	            else if (cbs['empty']) {
	                cbs['empty'](e, null, element);
	            }
	        }
	    };
	}
	function matches(cbs, element) {
	    let data;
	    for (const attr in cbs) {
	        if ((data = element.getAttribute(attr))) {
	            return { attr, data };
	        }
	    }
	}

	class DefaultSvelteGanttDateAdapter {
	    format(date, format) {
	        const d = new Date(date);
	        switch (format) {
	            case 'H':
	                return d.getHours() + '';
	            case 'HH':
	                return pad(d.getHours());
	            case 'H:mm':
	                return `${d.getHours()}:${pad(d.getMinutes())}`;
	            case 'hh:mm':
	                return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
	            case 'hh:mm:ss':
	                return `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	            case 'dd/MM/yyyy':
	                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
	            case 'dd/MM/yyyy hh:mm':
	                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
	            case 'dd/MM/yyyy hh:mm:ss':
	                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
	            // VPY More formats supported 10/12/2021
	            case 'YYYY':
	                return `${d.getFullYear()}`;
	            case 'Q':
	                return `${Math.floor(d.getMonth() / 3 + 1)}`;
	            case '[Q]Q':
	                return `Q${Math.floor(d.getMonth() / 3 + 1)}`;
	            case 'YYYY[Q]Q':
	                return `${d.getFullYear()}Q${Math.floor(d.getMonth() / 3 + 1)}`;
	            case 'MM': {
	                // const month = d.toLocaleString('default', { month: 'long' });
	                let month = String(d.getMonth() + 1);
	                if (month.length == 1)
	                    month = `0${month}`;
	                return `${month}`;
	            }
	            case 'MMMM': {
	                const month = d.toLocaleString('default', { month: 'long' });
	                return `${month.charAt(0).toUpperCase()}${month.substring(1)}`;
	            }
	            case 'MMMM - YYYY': {
	                const month = d.toLocaleString('default', { month: 'long' });
	                return `${month.charAt(0).toUpperCase()}${month.substring(1)}-${d.getFullYear()}`;
	            }
	            case 'MMMM YYYY': {
	                const month = d.toLocaleString('default', { month: 'long' });
	                return `${month.charAt(0).toUpperCase()}${month.substring(1)} ${d.getFullYear()}`;
	            }
	            case 'MMM': {
	                const month = d.toLocaleString('default', { month: 'short' });
	                return `${month.charAt(0).toUpperCase()}${month.substring(1)}`;
	            }
	            case 'MMM - YYYY': {
	                const month = d.toLocaleString('default', { month: 'short' });
	                return `${month.charAt(0).toUpperCase()}${month.substring(1)} - ${d.getFullYear()}`;
	            }
	            case 'MMM YYYY': {
	                const month = d.toLocaleString('default', { month: 'short' });
	                return `${month.charAt(0).toUpperCase()}${month.substring(1)} ${d.getFullYear()}`;
	            }
	            case 'W':
	                return `${getWeekNumber(d)}`;
	            case 'WW': {
	                const weeknumber = getWeekNumber(d);
	                return `${weeknumber.toString().length == 1 ? '0' : ''}${weeknumber}`;
	            }
	            default:
	                console.warn(`Date Format '${format}' is not supported, use another date adapter.`);
	                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
	        }
	    }
	    /**
	     * Rounds the date down to the nearest unit
	     *
	     * Note: This does not consider the timezone, rounds only to the UTC time, which makes it incorrect to round to day start or half hour time zones
	     */
	    roundTo(date, unit, offset) {
	        const magnetDuration = getPeriodDuration(unit, offset);
	        const value = Math.round(date / magnetDuration) * magnetDuration; //
	        return value;
	    }
	}
	function pad(value) {
	    let result = value.toString();
	    for (let i = result.length; i < 2; i++) {
	        result = '0' + result;
	    }
	    return result;
	}
	function getWeekNumber(d) {
	    // Copy date so don't modify original
	    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	    // Set to nearest Thursday: current date + 4 - current day number
	    // Make Sunday's day number 7
	    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	    // Get first day of year
	    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	    // Calculate full weeks to nearest Thursday
	    const weekNo = Math.ceil(((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
	    // Return array of year and week number
	    return weekNo;
	}
	/**
	 * Return duration
	 */
	function getPeriodDuration(unit, offset) {
	    switch (unit) {
	        case 'y':
	        case 'year':
	            // 2 cases 31622400000 (366) - 31536000000 (365)
	            return offset * 31536000000; // Incorrect since there is years with 366 days
	        case 'month':
	            // 4 cases : 28 - 29 - 30 - 31
	            return offset * 30 * 24 * 60 * 60 * 1000; // incorrect since months are of different durations
	        case 'week':
	            return offset * 7 * 24 * 60 * 60 * 1000;
	        case 'd':
	        case 'day':
	            return offset * 24 * 60 * 60 * 1000;
	        case 'h':
	        case 'hour':
	            return offset * 60 * 60 * 1000;
	        case 'm':
	        case 'minute':
	            return offset * 60 * 1000;
	        case 's':
	        case 'second':
	            return offset * 1000;
	        default:
	            throw new Error(`Unknown unit: ${unit}`);
	    }
	}

	/**
	 * Layouts tasks - overlapping tasks display one over another
	 * @param params
	 */
	function overlap(params) {
	    const { taskStore, rowStore, rowHeight, rowPadding, rowReflectedTasks } = params;
	    let top = 0;
	    const result = { changed: false };
	    if (!params.invalidateFull) {
	        for (const taskId in params.invalidatedTasks) {
	            positionTask(taskStore.entities[taskId]);
	        }
	        return result;
	    }
	    for (const rowId of rowStore.ids) {
	        const row = rowStore.entities[rowId];
	        row.y = top;
	        const prevHeight = row.height;
	        row.height = row.model.height || rowHeight;
	        if (!row.hidden) {
	            top += row.height;
	        }
	        if (prevHeight !== row.height) {
	            result.changed = true;
	        }
	        const reflectedTasks = rowReflectedTasks[rowId];
	        if (reflectedTasks) {
	            for (const task of reflectedTasks) {
	                positionTask(task);
	            }
	        }
	    }
	    function positionTask(task) {
	        const row = rowStore.entities[task.model.resourceId];
	        if (!row)
	            return;
	        task.height = (row ? row.height : undefined) - 2 * rowPadding;
	        task.top = row.y + rowPadding;
	    }
	    for (const taskId of taskStore.ids) {
	        positionTask(taskStore.entities[taskId]);
	    }
	    return result;
	}
	/**
	 * Layouts tasks - overlapping tasks display in the same row, but shrink to not overlap with eachother
	 * @param params
	 */
	function pack(params) {
	    // TODO:: partial invalidation
	    return _layoutRows(params, false);
	}
	/**
	 * Layouts tasks - overlapping tasks display in the same row, but row is expanded to fit them
	 * @param params
	 * @returns
	 */
	function expand(params) {
	    // TODO:: partial invalidation
	    return _layoutRows(params, true);
	}
	function _layoutRows(params, expandRow) {
	    const { taskStore, rowStore, rowTasks, rowHeight, rowPadding } = params;
	    let top = 0;
	    for (const rowId of rowStore.ids) {
	        const row = rowStore.entities[rowId];
	        const taskIds = rowTasks[rowId];
	        row.y = top;
	        const prevHeight = row.height;
	        if (taskIds) {
	            const tasks = taskIds.map(taskId => taskStore.entities[taskId]);
	            _layoutRow(tasks, row, {
	                rowHeight: rowHeight,
	                rowPadding,
	                expandRow,
	            });
	        }
	        if (!row.hidden) {
	            top += row.height;
	        }
	        if (prevHeight !== row.height) ;
	    }
	}
	function _layoutRow(tasks, row, params) {
	    if (!tasks.length) {
	        return;
	    }
	    tasks.sort(_byStartThenByLongestSortFn);
	    const others = {};
	    const context = {};
	    const ctx = (task) => context[task.model.id] ?? (context[task.model.id] = {});
	    let maxYPos = 0;
	    for (const task of tasks) {
	        const c = ctx(task);
	        c.yPos = 0;
	        let fits = false;
	        while (!fits) {
	            const othersAtYPos = others[c.yPos] || [];
	            fits = true;
	            for (const other of othersAtYPos) { // can use binary search to find this iterator
	                if (_intersects(task, other)) {
	                    ctx(task).intersects = ctx(other).intersects = true;
	                    c.yPos++;
	                    if (c.yPos > maxYPos) {
	                        maxYPos = c.yPos;
	                    }
	                    fits = false;
	                    break;
	                }
	                else {
	                    continue;
	                }
	            }
	        }
	        if (!others[c.yPos]) {
	            others[c.yPos] = [];
	        }
	        others[c.yPos].push(task);
	    }
	    if (params.expandRow) {
	        const contentHeight = (row.model.height || params.rowHeight) - 2 * params.rowPadding;
	        row.height = contentHeight * (maxYPos + 1) + 2 * params.rowPadding;
	        for (const task of tasks) {
	            const c = ctx(task);
	            task.height = contentHeight;
	            task.top = row.y + params.rowPadding + (task.height * c.yPos);
	        }
	    }
	    else {
	        row.height = row.model.height || params.rowHeight;
	        const contentHeight = row.height - 2 * params.rowPadding;
	        for (const task of tasks) {
	            const c = ctx(task);
	            task.height = contentHeight / (maxYPos + 1);
	            task.top = row.y + params.rowPadding + (task.height * c.yPos);
	        }
	    }
	}
	/** string intersection between tasks */
	function _intersects(left, right) {
	    return (left.left + left.width) > right.left && left.left < (right.left + right.width);
	}
	function _byStartThenByLongestSortFn(a, b) {
	    return (a.left - b.left) || ((b.left + b.width) - (a.left + a.width));
	}

	function useCreateTask() {
	    const { columnService, utils } = getContext('services');
	    return function createTaskActionBound(node, options) {
	        return createTaskAction(node, {
	            columnService,
	            utils,
	            ...options,
	        });
	    };
	}
	const MIN_DRAG_X = 2;
	const MIN_DRAG_Y = 2;
	function createTaskAction(node, options) {
	    let startX;
	    let startFrom;
	    let mouseStartRight;
	    let direction;
	    let initialX;
	    let initialY;
	    let triggered = false;
	    /** dragging will not activate around the edges */
	    let deadZone = 10;
	    const container = () => options.container;
	    function isNearEdge(x, y) {
	        const rect = options.boundsContainer.getBoundingClientRect();
	        const nearBottomEdge = y - rect.top >= rect.height - deadZone;
	        const nearRightEdge = x - rect.left >= rect.width - deadZone;
	        return nearBottomEdge || nearRightEdge;
	    }
	    function onMousedown(event) {
	        if (!options.enabled) {
	            return;
	        }
	        event.stopPropagation();
	        event.preventDefault();
	        if (isNearEdge(event.clientX, event.clientY)) {
	            return;
	        }
	        const [mousePosX, _] = getRelativePosition(container(), event);
	        const from = startFrom = options.utils.roundTo(options.columnService.getDateByPosition(mousePosX));
	        const x = startX = options.columnService.getPositionByDate(from) | 0;
	        const width = 0;
	        initialX = event.clientX;
	        initialY = event.clientY;
	        mouseStartRight = x + width;
	        window.addEventListener('pointermove', onMousemove, false);
	        window.addEventListener('pointerup', onMouseup);
	    }
	    function onMousemove(event) {
	        if (!triggered) {
	            if (Math.abs(event.clientX - initialX) > MIN_DRAG_X || Math.abs(event.clientY - initialY) > MIN_DRAG_Y) {
	                triggered = true;
	            }
	            else {
	                return;
	            }
	        }
	        event.preventDefault();
	        const { x, width, y } = getValues(event);
	        options.onMove({
	            from: startFrom,
	            to: startFrom,
	            x,
	            width,
	            y,
	        });
	    }
	    function getValues(event) {
	        const mousePos = getRelativePos(container(), event);
	        const x = startX;
	        const width = 0;
	        let resultX;
	        let resultWidth;
	        if (direction === 'left') {
	            if (mouseStartRight - mousePos.x <= 0) {
	                direction = 'right';
	                resultX = mouseStartRight;
	                resultWidth = mouseStartRight - mousePos.x;
	                mouseStartRight = mouseStartRight + width;
	            }
	            else {
	                resultX = mousePos.x;
	                resultWidth = mouseStartRight - mousePos.x;
	            }
	        }
	        else { // if (direction === 'right')
	            //resize right
	            if (mousePos.x - x <= 0) {
	                direction = 'left';
	                resultX = mousePos.x;
	                resultWidth = mousePos.x - x;
	                mouseStartRight = x;
	            }
	            else {
	                resultX = x;
	                resultWidth = mousePos.x - x;
	            }
	        }
	        return { x: resultX, width: resultWidth, y: mousePos.y };
	    }
	    function onMouseup(event) {
	        window.removeEventListener('pointerup', onMouseup);
	        window.removeEventListener('pointermove', onMousemove, false);
	        if (triggered) {
	            const { x, width, y } = getValues(event);
	            const newFrom = options.utils.roundTo(options.columnService.getDateByPosition(x));
	            const newTo = options.utils.roundTo(options.columnService.getDateByPosition(x + width));
	            const newLeft = options.columnService.getPositionByDate(newFrom) | 0;
	            const newRight = options.columnService.getPositionByDate(newTo) | 0;
	            options.onEnd({
	                from: newFrom,
	                to: newTo,
	                x: newLeft,
	                width: newRight - newLeft,
	                y,
	            });
	        }
	        mouseStartRight = null;
	        initialX = null;
	        initialY = null;
	        triggered = false;
	    }
	    node.addEventListener('pointerdown', onMousedown);
	    return {
	        destroy() {
	            node.removeEventListener('pointerdown', onMousedown);
	            window.removeEventListener('pointermove', onMousemove);
	            window.removeEventListener('pointerup', onMouseup);
	        },
	        update(opts) {
	            Object.assign(options, opts);
	        },
	    };
	}

	var css_248z$5 = ".sg-disable-transition.svelte-1csmpwr .sg-task,.sg-disable-transition.svelte-1csmpwr .sg-milestone{transition:transform 0s,\n            background-color 0.2s,\n            width 0s !important}.sg-view:not(:first-child){margin-left:5px}.sg-timeline.svelte-1csmpwr{flex:1 1 0%;display:flex;flex-direction:column;overflow-x:auto}.sg-gantt.svelte-1csmpwr{display:flex;width:100%;height:100%;position:relative}.sg-foreground.svelte-1csmpwr{box-sizing:border-box;overflow:hidden;top:0;left:0;position:absolute;width:100%;height:100%;z-index:1;pointer-events:none}.sg-rows.svelte-1csmpwr{width:100%;box-sizing:border-box;overflow:hidden}.sg-timeline-body.svelte-1csmpwr{overflow:auto;flex:1 1 auto}.sg-header-scroller.svelte-1csmpwr{overflow:hidden;position:relative}.content.svelte-1csmpwr{position:relative}*{box-sizing:border-box}";
	styleInject(css_248z$5);

	/* src/Gantt.svelte generated by Svelte v4.2.19 */

	function get_each_context$3(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[164] = list[i];
		return child_ctx;
	}

	function get_each_context_1$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[167] = list[i];
		return child_ctx;
	}

	function get_each_context_2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[172] = list[i];
		return child_ctx;
	}

	function get_each_context_3(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[175] = list[i];
		return child_ctx;
	}

	function get_each_context_4(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[172] = list[i];
		return child_ctx;
	}

	function get_each_context_5(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[164] = list[i];
		return child_ctx;
	}

	// (840:4) {#each ganttTableModules as module}
	function create_each_block_5(ctx) {
		let switch_instance;
		let t;
		let resizer;
		let current;

		const switch_instance_spread_levels = [
			{
				rowContainerHeight: /*rowContainerHeight*/ ctx[12]
			},
			{ paddingTop: /*paddingTop*/ ctx[25] },
			{ tableWidth: /*tableWidth*/ ctx[2] },
			/*$$restProps*/ ctx[62],
			{ visibleRows: /*visibleRows*/ ctx[13] }
		];

		var switch_value = /*module*/ ctx[164];

		function switch_props(ctx, dirty) {
			let switch_instance_props = {};

			for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
				switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
			}

			if (dirty !== undefined && dirty[0] & /*rowContainerHeight, paddingTop, tableWidth, visibleRows*/ 33566724 | dirty[2] & /*$$restProps*/ 1) {
				switch_instance_props = assign(switch_instance_props, get_spread_update(switch_instance_spread_levels, [
					dirty[0] & /*rowContainerHeight*/ 4096 && {
						rowContainerHeight: /*rowContainerHeight*/ ctx[12]
					},
					dirty[0] & /*paddingTop*/ 33554432 && { paddingTop: /*paddingTop*/ ctx[25] },
					dirty[0] & /*tableWidth*/ 4 && { tableWidth: /*tableWidth*/ ctx[2] },
					dirty[2] & /*$$restProps*/ 1 && get_spread_object(/*$$restProps*/ ctx[62]),
					dirty[0] & /*visibleRows*/ 8192 && { visibleRows: /*visibleRows*/ ctx[13] }
				]));
			}

			return { props: switch_instance_props };
		}

		if (switch_value) {
			switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
		}

		resizer = new Resizer({
				props: {
					x: /*tableWidth*/ ctx[2],
					container: /*ganttElement*/ ctx[18]
				}
			});

		resizer.$on("resize", /*onResize*/ ctx[54]);

		return {
			c() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				t = space();
				create_component(resizer.$$.fragment);
			},
			m(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert(target, t, anchor);
				mount_component(resizer, target, anchor);
				current = true;
			},
			p(ctx, dirty) {
				if (dirty[0] & /*ganttTableModules*/ 16 && switch_value !== (switch_value = /*module*/ ctx[164])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component(switch_value, switch_props(ctx, dirty));
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, t.parentNode, t);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = (dirty[0] & /*rowContainerHeight, paddingTop, tableWidth, visibleRows*/ 33566724 | dirty[2] & /*$$restProps*/ 1)
					? get_spread_update(switch_instance_spread_levels, [
							dirty[0] & /*rowContainerHeight*/ 4096 && {
								rowContainerHeight: /*rowContainerHeight*/ ctx[12]
							},
							dirty[0] & /*paddingTop*/ 33554432 && { paddingTop: /*paddingTop*/ ctx[25] },
							dirty[0] & /*tableWidth*/ 4 && { tableWidth: /*tableWidth*/ ctx[2] },
							dirty[2] & /*$$restProps*/ 1 && get_spread_object(/*$$restProps*/ ctx[62]),
							dirty[0] & /*visibleRows*/ 8192 && { visibleRows: /*visibleRows*/ ctx[13] }
						])
					: {};

					switch_instance.$set(switch_instance_changes);
				}

				const resizer_changes = {};
				if (dirty[0] & /*tableWidth*/ 4) resizer_changes.x = /*tableWidth*/ ctx[2];
				if (dirty[0] & /*ganttElement*/ 262144) resizer_changes.container = /*ganttElement*/ ctx[18];
				resizer.$set(resizer_changes);
			},
			i(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				transition_in(resizer.$$.fragment, local);
				current = true;
			},
			o(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				transition_out(resizer.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(t);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
				destroy_component(resizer, detaching);
			}
		};
	}

	// (863:20) {#each $allTimeRanges as timeRange (timeRange.model.id)}
	function create_each_block_4(key_1, ctx) {
		let first;
		let timerangeheader;
		let current;
		const timerangeheader_spread_levels = [/*timeRange*/ ctx[172]];
		let timerangeheader_props = {};

		for (let i = 0; i < timerangeheader_spread_levels.length; i += 1) {
			timerangeheader_props = assign(timerangeheader_props, timerangeheader_spread_levels[i]);
		}

		timerangeheader = new TimeRangeHeader({ props: timerangeheader_props });

		return {
			key: key_1,
			first: null,
			c() {
				first = empty();
				create_component(timerangeheader.$$.fragment);
				this.first = first;
			},
			m(target, anchor) {
				insert(target, first, anchor);
				mount_component(timerangeheader, target, anchor);
				current = true;
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;

				const timerangeheader_changes = (dirty[0] & /*$allTimeRanges*/ 536870912)
				? get_spread_update(timerangeheader_spread_levels, [get_spread_object(/*timeRange*/ ctx[172])])
				: {};

				timerangeheader.$set(timerangeheader_changes);
			},
			i(local) {
				if (current) return;
				transition_in(timerangeheader.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(timerangeheader.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(first);
				}

				destroy_component(timerangeheader, detaching);
			}
		};
	}

	// (891:24) {#each visibleRows as row (row.model.id)}
	function create_each_block_3(key_1, ctx) {
		let first;
		let row_1;
		let current;
		row_1 = new Row({ props: { row: /*row*/ ctx[175] } });

		return {
			key: key_1,
			first: null,
			c() {
				first = empty();
				create_component(row_1.$$.fragment);
				this.first = first;
			},
			m(target, anchor) {
				insert(target, first, anchor);
				mount_component(row_1, target, anchor);
				current = true;
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;
				const row_1_changes = {};
				if (dirty[0] & /*visibleRows*/ 8192) row_1_changes.row = /*row*/ ctx[175];
				row_1.$set(row_1_changes);
			},
			i(local) {
				if (current) return;
				transition_in(row_1.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(row_1.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(first);
				}

				destroy_component(row_1, detaching);
			}
		};
	}

	// (898:20) {#each $allTimeRanges as timeRange (timeRange.model.id)}
	function create_each_block_2(key_1, ctx) {
		let first;
		let timerange;
		let current;
		const timerange_spread_levels = [/*timeRange*/ ctx[172]];
		let timerange_props = {};

		for (let i = 0; i < timerange_spread_levels.length; i += 1) {
			timerange_props = assign(timerange_props, timerange_spread_levels[i]);
		}

		timerange = new TimeRange({ props: timerange_props });

		return {
			key: key_1,
			first: null,
			c() {
				first = empty();
				create_component(timerange.$$.fragment);
				this.first = first;
			},
			m(target, anchor) {
				insert(target, first, anchor);
				mount_component(timerange, target, anchor);
				current = true;
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;

				const timerange_changes = (dirty[0] & /*$allTimeRanges*/ 536870912)
				? get_spread_update(timerange_spread_levels, [get_spread_object(/*timeRange*/ ctx[172])])
				: {};

				timerange.$set(timerange_changes);
			},
			i(local) {
				if (current) return;
				transition_in(timerange.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(timerange.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(first);
				}

				destroy_component(timerange, detaching);
			}
		};
	}

	// (904:28) <Draggable {task} let:state let:onPointerDown>
	function create_default_slot_1(ctx) {
		let task_1;
		let t;
		let current;

		const task_1_spread_levels = [
			/*task*/ ctx[167],
			{ model: /*task*/ ctx[167].model },
			{ left: /*state*/ ctx[170].x },
			{ top: /*state*/ ctx[170].y },
			{ width: /*state*/ ctx[170].width },
			{ height: /*task*/ ctx[167].height },
			{ dragging: /*state*/ ctx[170].dragging },
			{ resizing: /*state*/ ctx[170].resizing }
		];

		let task_1_props = {};

		for (let i = 0; i < task_1_spread_levels.length; i += 1) {
			task_1_props = assign(task_1_props, task_1_spread_levels[i]);
		}

		task_1 = new Task({ props: task_1_props });

		task_1.$on("pointerdown", function () {
			if (is_function(/*onPointerDown*/ ctx[171])) /*onPointerDown*/ ctx[171].apply(this, arguments);
		});

		return {
			c() {
				create_component(task_1.$$.fragment);
				t = space();
			},
			m(target, anchor) {
				mount_component(task_1, target, anchor);
				insert(target, t, anchor);
				current = true;
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;

				const task_1_changes = (dirty[0] & /*visibleTasks*/ 67108864 | dirty[5] & /*state*/ 32768)
				? get_spread_update(task_1_spread_levels, [
						dirty[0] & /*visibleTasks*/ 67108864 && get_spread_object(/*task*/ ctx[167]),
						dirty[0] & /*visibleTasks*/ 67108864 && { model: /*task*/ ctx[167].model },
						dirty[5] & /*state*/ 32768 && { left: /*state*/ ctx[170].x },
						dirty[5] & /*state*/ 32768 && { top: /*state*/ ctx[170].y },
						dirty[5] & /*state*/ 32768 && { width: /*state*/ ctx[170].width },
						dirty[0] & /*visibleTasks*/ 67108864 && { height: /*task*/ ctx[167].height },
						dirty[5] & /*state*/ 32768 && { dragging: /*state*/ ctx[170].dragging },
						dirty[5] & /*state*/ 32768 && { resizing: /*state*/ ctx[170].resizing }
					])
				: {};

				task_1.$set(task_1_changes);
			},
			i(local) {
				if (current) return;
				transition_in(task_1.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(task_1.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(t);
				}

				destroy_component(task_1, detaching);
			}
		};
	}

	// (903:24) {#each visibleTasks as task (task.model.id)}
	function create_each_block_1$1(key_1, ctx) {
		let first;
		let draggable;
		let current;

		draggable = new Draggable({
				props: {
					task: /*task*/ ctx[167],
					$$slots: {
						default: [
							create_default_slot_1,
							({ state, onPointerDown }) => ({ 170: state, 171: onPointerDown }),
							({ state, onPointerDown }) => [0, 0, 0, 0, 0, (state ? 32768 : 0) | (onPointerDown ? 65536 : 0)]
						]
					},
					$$scope: { ctx }
				}
			});

		return {
			key: key_1,
			first: null,
			c() {
				first = empty();
				create_component(draggable.$$.fragment);
				this.first = first;
			},
			m(target, anchor) {
				insert(target, first, anchor);
				mount_component(draggable, target, anchor);
				current = true;
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;
				const draggable_changes = {};
				if (dirty[0] & /*visibleTasks*/ 67108864) draggable_changes.task = /*task*/ ctx[167];

				if (dirty[0] & /*visibleTasks*/ 67108864 | dirty[5] & /*$$scope, state, onPointerDown*/ 134316032) {
					draggable_changes.$$scope = { dirty, ctx };
				}

				draggable.$set(draggable_changes);
			},
			i(local) {
				if (current) return;
				transition_in(draggable.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(draggable.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(first);
				}

				destroy_component(draggable, detaching);
			}
		};
	}

	// (902:20) <DraggableGroup items={draggingTasks} on:change={onChange} on:itemsChange={onItemsChange}>
	function create_default_slot$1(ctx) {
		let each_blocks = [];
		let each_1_lookup = new Map();
		let each_1_anchor;
		let current;
		let each_value_1 = ensure_array_like(/*visibleTasks*/ ctx[26]);
		const get_key = ctx => /*task*/ ctx[167].model.id;

		for (let i = 0; i < each_value_1.length; i += 1) {
			let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
		}

		return {
			c() {
				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},
			m(target, anchor) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert(target, each_1_anchor, anchor);
				current = true;
			},
			p(ctx, dirty) {
				if (dirty[0] & /*visibleTasks*/ 67108864 | dirty[5] & /*state, onPointerDown*/ 98304) {
					each_value_1 = ensure_array_like(/*visibleTasks*/ ctx[26]);
					group_outros();
					each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1$1, each_1_anchor, get_each_context_1$1);
					check_outros();
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value_1.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(each_1_anchor);
				}

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].d(detaching);
				}
			}
		};
	}

	// (920:16) {#each ganttBodyModules as module}
	function create_each_block$3(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;

		const switch_instance_spread_levels = [
			{ paddingTop: /*paddingTop*/ ctx[25] },
			{ visibleRows: /*visibleRows*/ ctx[13] },
			/*$$restProps*/ ctx[62]
		];

		var switch_value = /*module*/ ctx[164];

		function switch_props(ctx, dirty) {
			let switch_instance_props = {};

			for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
				switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
			}

			if (dirty !== undefined && dirty[0] & /*paddingTop, visibleRows*/ 33562624 | dirty[2] & /*$$restProps*/ 1) {
				switch_instance_props = assign(switch_instance_props, get_spread_update(switch_instance_spread_levels, [
					dirty[0] & /*paddingTop*/ 33554432 && { paddingTop: /*paddingTop*/ ctx[25] },
					dirty[0] & /*visibleRows*/ 8192 && { visibleRows: /*visibleRows*/ ctx[13] },
					dirty[2] & /*$$restProps*/ 1 && get_spread_object(/*$$restProps*/ ctx[62])
				]));
			}

			return { props: switch_instance_props };
		}

		if (switch_value) {
			switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
		}

		return {
			c() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert(target, switch_instance_anchor, anchor);
				current = true;
			},
			p(ctx, dirty) {
				if (dirty[0] & /*ganttBodyModules*/ 32 && switch_value !== (switch_value = /*module*/ ctx[164])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component(switch_value, switch_props(ctx, dirty));
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = (dirty[0] & /*paddingTop, visibleRows*/ 33562624 | dirty[2] & /*$$restProps*/ 1)
					? get_spread_update(switch_instance_spread_levels, [
							dirty[0] & /*paddingTop*/ 33554432 && { paddingTop: /*paddingTop*/ ctx[25] },
							dirty[0] & /*visibleRows*/ 8192 && { visibleRows: /*visibleRows*/ ctx[13] },
							dirty[2] & /*$$restProps*/ 1 && get_spread_object(/*$$restProps*/ ctx[62])
						])
					: {};

					switch_instance.$set(switch_instance_changes);
				}
			},
			i(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};
	}

	function create_fragment$5(ctx) {
		let div9;
		let t0;
		let div8;
		let div2;
		let div1;
		let div0;
		let columnheader;
		let t1;
		let each_blocks_3 = [];
		let each1_lookup = new Map();
		let div2_style_value;
		let div2_resize_listener;
		let t2;
		let div7;
		let div6;
		let columns_1;
		let t3;
		let div4;
		let div3;
		let each_blocks_2 = [];
		let each2_lookup = new Map();
		let t4;
		let div5;
		let each_blocks_1 = [];
		let each3_lookup = new Map();
		let t5;
		let draggablegroup;
		let t6;
		let div7_resize_listener;
		let dragCreateTasks_action;
		let div9_class_value;
		let current;
		let mounted;
		let dispose;
		let each_value_5 = ensure_array_like(/*ganttTableModules*/ ctx[4]);
		let each_blocks_4 = [];

		for (let i = 0; i < each_value_5.length; i += 1) {
			each_blocks_4[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
		}

		const out = i => transition_out(each_blocks_4[i], 1, 1, () => {
			each_blocks_4[i] = null;
		});

		columnheader = new ColumnHeader({
				props: {
					headers: /*headers*/ ctx[1],
					ganttBodyColumns: /*columns*/ ctx[23],
					ganttBodyUnit: /*columnUnit*/ ctx[0]
				}
			});

		columnheader.$on("dateSelected", /*onDateSelected*/ ctx[56]);
		let each_value_4 = ensure_array_like(/*$allTimeRanges*/ ctx[29]);
		const get_key = ctx => /*timeRange*/ ctx[172].model.id;

		for (let i = 0; i < each_value_4.length; i += 1) {
			let child_ctx = get_each_context_4(ctx, each_value_4, i);
			let key = get_key(child_ctx);
			each1_lookup.set(key, each_blocks_3[i] = create_each_block_4(key, child_ctx));
		}

		columns_1 = new Columns({
				props: {
					columns: /*columns*/ ctx[23],
					columnStrokeColor: /*columnStrokeColor*/ ctx[7],
					columnStrokeWidth: /*columnStrokeWidth*/ ctx[8],
					useCanvasColumns: /*useCanvasColumns*/ ctx[6]
				}
			});

		let each_value_3 = ensure_array_like(/*visibleRows*/ ctx[13]);
		const get_key_1 = ctx => /*row*/ ctx[175].model.id;

		for (let i = 0; i < each_value_3.length; i += 1) {
			let child_ctx = get_each_context_3(ctx, each_value_3, i);
			let key = get_key_1(child_ctx);
			each2_lookup.set(key, each_blocks_2[i] = create_each_block_3(key, child_ctx));
		}

		let each_value_2 = ensure_array_like(/*$allTimeRanges*/ ctx[29]);
		const get_key_2 = ctx => /*timeRange*/ ctx[172].model.id;

		for (let i = 0; i < each_value_2.length; i += 1) {
			let child_ctx = get_each_context_2(ctx, each_value_2, i);
			let key = get_key_2(child_ctx);
			each3_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
		}

		draggablegroup = new DraggableGroup({
				props: {
					items: /*draggingTasks*/ ctx[14],
					$$slots: { default: [create_default_slot$1] },
					$$scope: { ctx }
				}
			});

		draggablegroup.$on("change", /*onChange*/ ctx[60]);
		draggablegroup.$on("itemsChange", /*onItemsChange*/ ctx[61]);
		let each_value = ensure_array_like(/*ganttBodyModules*/ ctx[5]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
		}

		const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		return {
			c() {
				div9 = element("div");

				for (let i = 0; i < each_blocks_4.length; i += 1) {
					each_blocks_4[i].c();
				}

				t0 = space();
				div8 = element("div");
				div2 = element("div");
				div1 = element("div");
				div0 = element("div");
				create_component(columnheader.$$.fragment);
				t1 = space();

				for (let i = 0; i < each_blocks_3.length; i += 1) {
					each_blocks_3[i].c();
				}

				t2 = space();
				div7 = element("div");
				div6 = element("div");
				create_component(columns_1.$$.fragment);
				t3 = space();
				div4 = element("div");
				div3 = element("div");

				for (let i = 0; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].c();
				}

				t4 = space();
				div5 = element("div");

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t5 = space();
				create_component(draggablegroup.$$.fragment);
				t6 = space();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(div0, "class", "header-container");
				set_style(div0, "width", /*$_width*/ ctx[16] + "px");
				attr(div1, "class", "sg-header-scroller svelte-1csmpwr");
				attr(div2, "class", "sg-header");
				attr(div2, "style", div2_style_value = `padding-right: ${/*$rightScrollbarVisible*/ ctx[27]}px;`);
				add_render_callback(() => /*div2_elementresize_handler*/ ctx[131].call(div2));
				set_style(div3, "transform", "translateY(" + /*paddingTop*/ ctx[25] + "px)");
				attr(div4, "class", "sg-rows svelte-1csmpwr");
				set_style(div4, "height", /*rowContainerHeight*/ ctx[12] + "px");
				attr(div5, "class", "sg-foreground svelte-1csmpwr");
				attr(div6, "class", "content svelte-1csmpwr");
				set_style(div6, "width", /*$_width*/ ctx[16] + "px");
				attr(div7, "class", "sg-timeline-body svelte-1csmpwr");
				add_render_callback(() => /*div7_elementresize_handler*/ ctx[134].call(div7));
				toggle_class(div7, "zooming", /*zooming*/ ctx[24]);
				attr(div8, "class", "sg-timeline sg-view svelte-1csmpwr");
				attr(div9, "class", div9_class_value = "sg-gantt " + /*classes*/ ctx[3] + " svelte-1csmpwr");
				toggle_class(div9, "sg-disable-transition", /*disableTransition*/ ctx[22]);
			},
			m(target, anchor) {
				insert(target, div9, anchor);

				for (let i = 0; i < each_blocks_4.length; i += 1) {
					if (each_blocks_4[i]) {
						each_blocks_4[i].m(div9, null);
					}
				}

				append(div9, t0);
				append(div9, div8);
				append(div8, div2);
				append(div2, div1);
				append(div1, div0);
				mount_component(columnheader, div0, null);
				append(div0, t1);

				for (let i = 0; i < each_blocks_3.length; i += 1) {
					if (each_blocks_3[i]) {
						each_blocks_3[i].m(div0, null);
					}
				}

				/*div2_binding*/ ctx[130](div2);
				div2_resize_listener = add_iframe_resize_listener(div2, /*div2_elementresize_handler*/ ctx[131].bind(div2));
				append(div8, t2);
				append(div8, div7);
				append(div7, div6);
				mount_component(columns_1, div6, null);
				append(div6, t3);
				append(div6, div4);
				append(div4, div3);

				for (let i = 0; i < each_blocks_2.length; i += 1) {
					if (each_blocks_2[i]) {
						each_blocks_2[i].m(div3, null);
					}
				}

				/*div4_binding*/ ctx[132](div4);
				append(div6, t4);
				append(div6, div5);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(div5, null);
					}
				}

				append(div5, t5);
				mount_component(draggablegroup, div5, null);
				append(div6, t6);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div6, null);
					}
				}

				/*div7_binding*/ ctx[133](div7);
				div7_resize_listener = add_iframe_resize_listener(div7, /*div7_elementresize_handler*/ ctx[134].bind(div7));
				/*div9_binding*/ ctx[135](div9);
				current = true;

				if (!mounted) {
					dispose = [
						action_destroyer(/*horizontalScrollListener*/ ctx[53].call(null, div1)),
						action_destroyer(/*scrollable*/ ctx[52].call(null, div7)),
						listen(div7, "wheel", /*onwheel*/ ctx[55]),
						action_destroyer(dragCreateTasks_action = /*dragCreateTasks*/ ctx[59].call(null, div7, {
							container: /*rowContainer*/ ctx[21],
							enabled: /*enableCreateTask*/ ctx[9],
							onMove: /*onCreateTaskMove*/ ctx[57],
							onEnd: /*onCreateTaskEnd*/ ctx[58],
							boundsContainer: /*mainContainer*/ ctx[20]
						})),
						listen(div9, "pointerdown", stop_propagation(/*onEvent*/ ctx[51])),
						listen(div9, "click", stop_propagation(/*onEvent*/ ctx[51])),
						listen(div9, "dblclick", /*onEvent*/ ctx[51]),
						listen(div9, "pointerover", /*onEvent*/ ctx[51]),
						listen(div9, "pointerleave", /*onEvent*/ ctx[51])
					];

					mounted = true;
				}
			},
			p(ctx, dirty) {
				if (dirty[0] & /*tableWidth, ganttElement, ganttTableModules, rowContainerHeight, paddingTop, visibleRows*/ 33828884 | dirty[1] & /*onResize*/ 8388608 | dirty[2] & /*$$restProps*/ 1) {
					each_value_5 = ensure_array_like(/*ganttTableModules*/ ctx[4]);
					let i;

					for (i = 0; i < each_value_5.length; i += 1) {
						const child_ctx = get_each_context_5(ctx, each_value_5, i);

						if (each_blocks_4[i]) {
							each_blocks_4[i].p(child_ctx, dirty);
							transition_in(each_blocks_4[i], 1);
						} else {
							each_blocks_4[i] = create_each_block_5(child_ctx);
							each_blocks_4[i].c();
							transition_in(each_blocks_4[i], 1);
							each_blocks_4[i].m(div9, t0);
						}
					}

					group_outros();

					for (i = each_value_5.length; i < each_blocks_4.length; i += 1) {
						out(i);
					}

					check_outros();
				}

				const columnheader_changes = {};
				if (dirty[0] & /*headers*/ 2) columnheader_changes.headers = /*headers*/ ctx[1];
				if (dirty[0] & /*columns*/ 8388608) columnheader_changes.ganttBodyColumns = /*columns*/ ctx[23];
				if (dirty[0] & /*columnUnit*/ 1) columnheader_changes.ganttBodyUnit = /*columnUnit*/ ctx[0];
				columnheader.$set(columnheader_changes);

				if (dirty[0] & /*$allTimeRanges*/ 536870912) {
					each_value_4 = ensure_array_like(/*$allTimeRanges*/ ctx[29]);
					group_outros();
					each_blocks_3 = update_keyed_each(each_blocks_3, dirty, get_key, 1, ctx, each_value_4, each1_lookup, div0, outro_and_destroy_block, create_each_block_4, null, get_each_context_4);
					check_outros();
				}

				if (!current || dirty[0] & /*$_width*/ 65536) {
					set_style(div0, "width", /*$_width*/ ctx[16] + "px");
				}

				if (!current || dirty[0] & /*$rightScrollbarVisible*/ 134217728 && div2_style_value !== (div2_style_value = `padding-right: ${/*$rightScrollbarVisible*/ ctx[27]}px;`)) {
					attr(div2, "style", div2_style_value);
				}

				const columns_1_changes = {};
				if (dirty[0] & /*columns*/ 8388608) columns_1_changes.columns = /*columns*/ ctx[23];
				if (dirty[0] & /*columnStrokeColor*/ 128) columns_1_changes.columnStrokeColor = /*columnStrokeColor*/ ctx[7];
				if (dirty[0] & /*columnStrokeWidth*/ 256) columns_1_changes.columnStrokeWidth = /*columnStrokeWidth*/ ctx[8];
				if (dirty[0] & /*useCanvasColumns*/ 64) columns_1_changes.useCanvasColumns = /*useCanvasColumns*/ ctx[6];
				columns_1.$set(columns_1_changes);

				if (dirty[0] & /*visibleRows*/ 8192) {
					each_value_3 = ensure_array_like(/*visibleRows*/ ctx[13]);
					group_outros();
					each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key_1, 1, ctx, each_value_3, each2_lookup, div3, outro_and_destroy_block, create_each_block_3, null, get_each_context_3);
					check_outros();
				}

				if (!current || dirty[0] & /*paddingTop*/ 33554432) {
					set_style(div3, "transform", "translateY(" + /*paddingTop*/ ctx[25] + "px)");
				}

				if (!current || dirty[0] & /*rowContainerHeight*/ 4096) {
					set_style(div4, "height", /*rowContainerHeight*/ ctx[12] + "px");
				}

				if (dirty[0] & /*$allTimeRanges*/ 536870912) {
					each_value_2 = ensure_array_like(/*$allTimeRanges*/ ctx[29]);
					group_outros();
					each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_2, 1, ctx, each_value_2, each3_lookup, div5, outro_and_destroy_block, create_each_block_2, t5, get_each_context_2);
					check_outros();
				}

				const draggablegroup_changes = {};
				if (dirty[0] & /*draggingTasks*/ 16384) draggablegroup_changes.items = /*draggingTasks*/ ctx[14];

				if (dirty[0] & /*visibleTasks*/ 67108864 | dirty[5] & /*$$scope*/ 134217728) {
					draggablegroup_changes.$$scope = { dirty, ctx };
				}

				draggablegroup.$set(draggablegroup_changes);

				if (dirty[0] & /*ganttBodyModules, paddingTop, visibleRows*/ 33562656 | dirty[2] & /*$$restProps*/ 1) {
					each_value = ensure_array_like(/*ganttBodyModules*/ ctx[5]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$3(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$3(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(div6, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out_1(i);
					}

					check_outros();
				}

				if (!current || dirty[0] & /*$_width*/ 65536) {
					set_style(div6, "width", /*$_width*/ ctx[16] + "px");
				}

				if (dragCreateTasks_action && is_function(dragCreateTasks_action.update) && dirty[0] & /*rowContainer, enableCreateTask, mainContainer*/ 3146240) dragCreateTasks_action.update.call(null, {
					container: /*rowContainer*/ ctx[21],
					enabled: /*enableCreateTask*/ ctx[9],
					onMove: /*onCreateTaskMove*/ ctx[57],
					onEnd: /*onCreateTaskEnd*/ ctx[58],
					boundsContainer: /*mainContainer*/ ctx[20]
				});

				if (!current || dirty[0] & /*zooming*/ 16777216) {
					toggle_class(div7, "zooming", /*zooming*/ ctx[24]);
				}

				if (!current || dirty[0] & /*classes*/ 8 && div9_class_value !== (div9_class_value = "sg-gantt " + /*classes*/ ctx[3] + " svelte-1csmpwr")) {
					attr(div9, "class", div9_class_value);
				}

				if (!current || dirty[0] & /*classes, disableTransition*/ 4194312) {
					toggle_class(div9, "sg-disable-transition", /*disableTransition*/ ctx[22]);
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value_5.length; i += 1) {
					transition_in(each_blocks_4[i]);
				}

				transition_in(columnheader.$$.fragment, local);

				for (let i = 0; i < each_value_4.length; i += 1) {
					transition_in(each_blocks_3[i]);
				}

				transition_in(columns_1.$$.fragment, local);

				for (let i = 0; i < each_value_3.length; i += 1) {
					transition_in(each_blocks_2[i]);
				}

				for (let i = 0; i < each_value_2.length; i += 1) {
					transition_in(each_blocks_1[i]);
				}

				transition_in(draggablegroup.$$.fragment, local);

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				each_blocks_4 = each_blocks_4.filter(Boolean);

				for (let i = 0; i < each_blocks_4.length; i += 1) {
					transition_out(each_blocks_4[i]);
				}

				transition_out(columnheader.$$.fragment, local);

				for (let i = 0; i < each_blocks_3.length; i += 1) {
					transition_out(each_blocks_3[i]);
				}

				transition_out(columns_1.$$.fragment, local);

				for (let i = 0; i < each_blocks_2.length; i += 1) {
					transition_out(each_blocks_2[i]);
				}

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					transition_out(each_blocks_1[i]);
				}

				transition_out(draggablegroup.$$.fragment, local);
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div9);
				}

				destroy_each(each_blocks_4, detaching);
				destroy_component(columnheader);

				for (let i = 0; i < each_blocks_3.length; i += 1) {
					each_blocks_3[i].d();
				}

				/*div2_binding*/ ctx[130](null);
				div2_resize_listener();
				destroy_component(columns_1);

				for (let i = 0; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d();
				}

				/*div4_binding*/ ctx[132](null);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d();
				}

				destroy_component(draggablegroup);
				destroy_each(each_blocks, detaching);
				/*div7_binding*/ ctx[133](null);
				div7_resize_listener();
				/*div9_binding*/ ctx[135](null);
				mounted = false;
				run_all(dispose);
			}
		};
	}

	function assertSet(values) {
		for (const name in values) {
			if (values[name] == null) {
				throw new Error(`"${name}" is not set`);
			}
		}
	}

	function toDateNum(date) {
		return date instanceof Date ? date.valueOf() : date;
	}

	function instance$5($$self, $$props, $$invalidate) {
		const omit_props_names = [
			"rows","tasks","timeRanges","rowPadding","rowHeight","from","to","minWidth","fitWidth","classes","headers","zoomLevels","taskContent","tableWidth","resizeHandleWidth","onTaskButtonClick","dateAdapter","magnetUnit","magnetOffset","columnUnit","columnOffset","ganttTableModules","ganttBodyModules","reflectOnParentRows","reflectOnChildRows","useCanvasColumns","columnStrokeColor","columnStrokeWidth","highlightedDurations","highlightColor","taskElementHook","layout","columnService","api","timeRangeFactory","utils","refreshTimeRanges","refreshTasks","getRowContainer","selectTask","unselectTasks","scrollToRow","scrollToTask","updateTask","updateTasks","removeTask","removeTasks","updateRow","updateRows","getRow","getTask","getTasks","updateLayoutSync","updateLayout","enableCreateTask","onCreateTask","onCreatedTask"
		];

		let $$restProps = compute_rest_props($$props, omit_props_names);
		let $allRows;
		let $rowTaskCache;
		let $rowStore;
		let $taskStore;
		let $visibleHeight;
		let $allTasks;
		let $_width;
		let $_to;
		let $_from;
		let $_fitWidth;
		let $_minWidth;
		let $hoveredRow;
		let $selectedRow;
		let $visibleWidth;
		let $rightScrollbarVisible;
		let $bottomScrollbarVisible;
		let $_layout;
		let $_rowPadding;
		let $_rowHeight;
		let $headerHeight;
		let $allTimeRanges;
		let ganttElement;
		let mainHeaderContainer;
		let mainContainer;
		let rowContainer;
		let scrollables = [];
		let mounted = false;
		let { rows } = $$props;
		let { tasks = [] } = $$props;
		let { timeRanges = [] } = $$props;
		assertSet({ rows });
		let { rowPadding = 6 } = $$props;
		let { rowHeight = 52 } = $$props;
		const _rowHeight = writable(rowHeight);
		component_subscribe($$self, _rowHeight, value => $$invalidate(147, $_rowHeight = value));
		const _rowPadding = writable(rowPadding);
		component_subscribe($$self, _rowPadding, value => $$invalidate(146, $_rowPadding = value));
		let { from } = $$props;
		let { to } = $$props;
		assertSet({ from, to });
		const _from = writable(toDateNum(from));
		component_subscribe($$self, _from, value => $$invalidate(129, $_from = value));
		const _to = writable(toDateNum(to));
		component_subscribe($$self, _to, value => $$invalidate(128, $_to = value));
		let { minWidth = 800 } = $$props;
		let { fitWidth = false } = $$props;
		const _minWidth = writable(minWidth);
		component_subscribe($$self, _minWidth, value => $$invalidate(141, $_minWidth = value));
		const _fitWidth = writable(fitWidth);
		component_subscribe($$self, _fitWidth, value => $$invalidate(140, $_fitWidth = value));
		let { classes = [] } = $$props;
		let { headers = [{ unit: 'day', format: 'MMMM Do' }, { unit: 'hour', format: 'H:mm' }] } = $$props;

		let { zoomLevels = [
			{
				headers: [{ unit: 'day', format: 'DD.MM.YYYY' }, { unit: 'hour', format: 'HH' }],
				minWidth: 800,
				fitWidth: true
			},
			{
				headers: [
					{ unit: 'hour', format: 'ddd D/M, H A' },
					{ unit: 'minute', format: 'mm', offset: 15 }
				],
				minWidth: 5000,
				fitWidth: false
			}
		] } = $$props;

		let { taskContent = null } = $$props;
		let { tableWidth = 240 } = $$props;
		let { resizeHandleWidth = 10 } = $$props;
		let { onTaskButtonClick = null } = $$props;
		let { dateAdapter = new DefaultSvelteGanttDateAdapter() } = $$props;
		let { magnetUnit = 'minute' } = $$props;
		let { magnetOffset = 15 } = $$props;
		let magnetDuration;
		setMagnetDuration(magnetUnit, magnetOffset);

		function setMagnetDuration(unit, offset) {
			if (unit && offset) {
				magnetDuration = getDuration(unit, offset);
			}
		}

		let { columnUnit = 'minute' } = $$props;
		let { columnOffset = 15 } = $$props;
		let { ganttTableModules = [] } = $$props;
		let { ganttBodyModules = [] } = $$props;
		let { reflectOnParentRows = true } = $$props;
		let { reflectOnChildRows = false } = $$props;
		let { useCanvasColumns = true } = $$props;
		let { columnStrokeColor = '#efefef' } = $$props;
		let { columnStrokeWidth = 1 } = $$props;
		let { highlightedDurations } = $$props;
		let { highlightColor = '#6eb859' } = $$props;
		let { taskElementHook = null } = $$props;
		let { layout = 'overlap' } = $$props;
		const _layout = writable(layout);
		component_subscribe($$self, _layout, value => $$invalidate(145, $_layout = value));
		const visibleWidth = writable(null);
		component_subscribe($$self, visibleWidth, value => $$invalidate(17, $visibleWidth = value));
		const visibleHeight = writable(null);
		component_subscribe($$self, visibleHeight, value => $$invalidate(15, $visibleHeight = value));
		const headerHeight = writable(null);
		component_subscribe($$self, headerHeight, value => $$invalidate(28, $headerHeight = value));

		const _width = derived([visibleWidth, _minWidth, _fitWidth], ([visible, min, stretch]) => {
			return stretch && visible > min ? visible : min;
		});

		component_subscribe($$self, _width, value => $$invalidate(16, $_width = value));
		const dataStore = createDataStore();
		setContext('dataStore', dataStore);
		const { rowStore, taskStore, timeRangeStore, allTasks, allRows, allTimeRanges, rowTaskCache } = dataStore;
		component_subscribe($$self, rowStore, value => $$invalidate(125, $rowStore = value));
		component_subscribe($$self, taskStore, value => $$invalidate(126, $taskStore = value));
		component_subscribe($$self, allTasks, value => $$invalidate(127, $allTasks = value));
		component_subscribe($$self, allRows, value => $$invalidate(123, $allRows = value));
		component_subscribe($$self, allTimeRanges, value => $$invalidate(29, $allTimeRanges = value));
		component_subscribe($$self, rowTaskCache, value => $$invalidate(124, $rowTaskCache = value));

		const columnService = createColumnService({
			get columns() {
				return columns;
			},
			get magnetDuration() {
				return magnetDuration;
			}
		});

		let disableTransition = false;

		async function tickWithoutCSSTransition() {
			$$invalidate(22, disableTransition = true);
			await tick();
			ganttElement.offsetHeight; // force a reflow
			$$invalidate(22, disableTransition = false);
		}

		let columns;

		function getColumnsV2(from, to, unit, offset, width) {
			//BUG: Function is running twice on init, how to prevent it?
			if (from instanceof Date) from = from.valueOf();

			if (to instanceof Date) to = to.valueOf();
			let cols = [];
			const periods = getAllPeriods(from.valueOf(), to.valueOf(), unit, offset, highlightedDurations);
			let left = 0;
			let distance_point = 0;

			periods.forEach(function (period) {
				left = distance_point;
				distance_point = getPositionByDate(period.to, $_from, $_to, $_width);

				cols.push({
					width: distance_point - left,
					from: period.from,
					to: period.to,
					left,
					duration: period.duration,
					...period.isHighlighted && { bgHighlightColor: highlightColor }
				});
			});

			return cols;
		}

		let offsetWidth;
		let offsetHeight;
		let bottomScrollbarVisible = writable(offsetHeight - $visibleHeight);
		component_subscribe($$self, bottomScrollbarVisible, value => $$invalidate(144, $bottomScrollbarVisible = value));
		let rightScrollbarVisible = writable(offsetWidth - $visibleWidth);
		component_subscribe($$self, rightScrollbarVisible, value => $$invalidate(27, $rightScrollbarVisible = value));

		setContext('dimensions', {
			from: _from,
			to: _to,
			width: _width,
			visibleWidth,
			visibleHeight,
			headerHeight,
			bottomScrollbarVisible,
			rightScrollbarVisible
		});

		setContext('options', {
			dateAdapter,
			taskElementHook,
			taskContent,
			rowPadding: _rowPadding,
			rowHeight: _rowHeight,
			layout: _layout,
			resizeHandleWidth,
			reflectOnParentRows,
			reflectOnChildRows,
			onTaskButtonClick
		});

		const hoveredRow = writable(null);
		component_subscribe($$self, hoveredRow, value => $$invalidate(142, $hoveredRow = value));
		const selectedRow = writable(null);
		component_subscribe($$self, selectedRow, value => $$invalidate(143, $selectedRow = value));

		const ganttContext = {
			rowContainer: null,
			mainContainer: null,
			mainHeaderContainer: null,
			scrollables,
			hoveredRow,
			selectedRow,
			updateLayout,
			expandRow(row) {
				expandRow(row);
				updateLayout();
			},
			collapseRow(row) {
				collapseRow(row);
				updateLayout();
			},
			invalidatePosition
		};

		setContext('gantt', ganttContext);
		let invalidatedTasks = {};
		let invalidatedRows = {};
		let invalidateFull = true;

		function invalidatePosition({ task, row }) {
			if (row) {
				$$invalidate(112, invalidatedRows[row.model.id] = true, invalidatedRows);
				$$invalidate(113, invalidateFull = false);
			}

			if (task) {
				$$invalidate(111, invalidatedTasks[task.model.id] = true, invalidatedTasks);
				$$invalidate(112, invalidatedRows[task.model.resourceId] = true, invalidatedRows);
				$$invalidate(113, invalidateFull = false);
			}
		}

		onMount(() => {
			Object.assign(ganttContext, {
				rowContainer,
				mainContainer,
				mainHeaderContainer
			});

			$$invalidate(110, mounted = true);
		});

		const { onDelegatedEvent, offDelegatedEvent, onEvent } = createDelegatedEventDispatcher();

		onDelegatedEvent('click', 'data-task-id', (event, data, target) => {
			const taskId = data;
			const task = $taskStore.entities[taskId];

			if (isLeftClick(event) && !target.classList.contains('sg-task-reflected') && !target.classList.contains('sg-ignore-click')) {
				if (event.ctrlKey) {
					selectionManager.toggleSelection(taskId);
				} else {
					selectionManager.selectSingle(taskId);
				}
			}

			api['tasks'].raise.select(task);
		});

		onDelegatedEvent('pointerover', 'data-row-id', (event, data, target) => {
			set_store_value(hoveredRow, $hoveredRow = data, $hoveredRow);
		});

		onDelegatedEvent('click', 'data-row-id', (event, data, target) => {
			selectionManager.unSelectTasks();

			if ($selectedRow == data) {
				set_store_value(selectedRow, $selectedRow = null, $selectedRow);
				return;
			}

			set_store_value(selectedRow, $selectedRow = data, $selectedRow);
		});

		onDelegatedEvent('dblclick', 'data-task-id', (event, data, target) => {
			const taskId = data;
			api['tasks'].raise.dblclicked($taskStore.entities[taskId], event);
		});

		onDelegatedEvent('pointerleave', 'empty', (event, data, target) => {
			set_store_value(hoveredRow, $hoveredRow = null, $hoveredRow);
		});

		onDestroy(() => {
			offDelegatedEvent('click', 'data-task-id');
			offDelegatedEvent('click', 'data-row-id');
			offDelegatedEvent('dblclick', 'data-task-id');
			selectionManager.unSelectTasks();
		});

		let __scrollTop = 0;

		function scrollable(node) {
			const onscroll = event => {
				const { scrollTop, scrollLeft } = node;

				scrollables.forEach(scrollable => {
					if (scrollable.orientation === 'horizontal') {
						scrollable.node.scrollLeft = scrollLeft;
					} else {
						scrollable.node.scrollTop = scrollTop;
					}
				});

				$$invalidate(114, __scrollTop = scrollTop);
			};

			node.addEventListener('scroll', onscroll);

			return {
				destroy() {
					node.removeEventListener('scroll', onscroll, false);
				}
			};
		}

		function horizontalScrollListener(node) {
			scrollables.push({ node, orientation: 'horizontal' });
		}

		function onResize(event) {
			$$invalidate(2, tableWidth = event.detail.left);
		}

		let zoomLevel = 0;
		let zooming = false;

		async function onwheel(event) {
			if (event.ctrlKey) {
				event.preventDefault();
				const prevZoomLevel = zoomLevel;

				if (event.deltaY > 0) {
					zoomLevel = Math.max(zoomLevel - 1, 0);
				} else {
					zoomLevel = Math.min(zoomLevel + 1, zoomLevels.length - 1);
				}

				if (prevZoomLevel != zoomLevel && zoomLevels[zoomLevel]) {
					const options = {
						columnUnit,
						columnOffset,
						minWidth: $_minWidth,
						...zoomLevels[zoomLevel]
					};

					const scale = options.minWidth / $_width;
					const node = mainContainer;
					const mousepos = getRelativePos(node, event);
					const before = node.scrollLeft + mousepos.x;
					const after = before * scale;
					const scrollLeft = after - mousepos.x + node.clientWidth / 2;
					$$invalidate(0, columnUnit = options.columnUnit);
					$$invalidate(63, columnOffset = options.columnOffset);
					set_store_value(_minWidth, $_minWidth = options.minWidth, $_minWidth);
					if (options.headers) $$invalidate(1, headers = options.headers);
					if (options.fitWidth) set_store_value(_fitWidth, $_fitWidth = options.fitWidth, $_fitWidth);
					api['gantt'].raise.viewChanged();
					$$invalidate(24, zooming = true);
					await tick();
					node.scrollLeft = scrollLeft;
					$$invalidate(24, zooming = false);
				}
			}
		}

		function onDateSelected(event) {
			set_store_value(_from, $_from = event.detail.from, $_from);
			set_store_value(_to, $_to = event.detail.to, $_to);
			api['gantt'].raise.dateSelected({ from: $_from, to: $_to });
		}

		function initRows(rowsData) {
			//Bug: Running twice on change options
			const rows = createRows(rowsData, { rowHeight });

			rowStore.addAll(rows);
			updateLayout();
		}

		const { createTask, reflectTask } = createTaskFactory({
			get rowEntities() {
				return $rowStore.entities;
			},
			get rowPadding() {
				return rowPadding;
			},
			getPositionByDate: date => columnService.getPositionByDate(date)
		});

		async function initTasks(taskData) {
			const tasks = [];

			for (const taskModel of taskData) {
				if (!draggingTasks[taskModel.id]) {
					delete draggingTasks[taskModel.id];
				}

				const task = createTask(taskModel);
				tasks.push(task);
			}

			taskStore.addAll(tasks);
			updateLayout();
		}

		let _reflectedTasksCache = {};

		function initTimeRanges(timeRangeData) {
			const timeRanges = timeRangeData.map(timeRange => {
				return timeRangeFactory.create(timeRange);
			});

			timeRangeStore.addAll(timeRanges);
		}

		const api = provideGanttApi();
		const selectionManager = new SelectionManager(taskStore);
		const timeRangeFactory = new TimeRangeFactory(columnService);

		const utils = createUtils({
			get from() {
				return $_from;
			},
			get to() {
				return $_to;
			},
			get width() {
				return $_width;
			},
			get magnetOffset() {
				return magnetOffset;
			},
			get magnetUnit() {
				return magnetUnit;
			},
			get magnetDuration() {
				return magnetDuration;
			},
			get dateAdapter() {
				return dateAdapter;
			}
		});

		setContext('services', {
			utils,
			api,
			selectionManager,
			columnService
		});

		function refreshTimeRanges() {
			timeRangeStore._update(({ ids, entities }) => {
				ids.forEach(id => {
					const timeRange = entities[id];
					const newLeft = columnService.getPositionByDate(timeRange.model.from) | 0;
					const newRight = columnService.getPositionByDate(timeRange.model.to) | 0;
					timeRange.left = newLeft;
					timeRange.width = newRight - newLeft;
				});

				return { ids, entities };
			});
		}

		function refreshTasks() {
			$allTasks.forEach(task => {
				const newLeft = columnService.getPositionByDate(task.model.from) | 0;
				const newRight = columnService.getPositionByDate(task.model.to) | 0;
				task.left = newLeft;
				task.width = newRight - newLeft;
			});

			taskStore.refresh();
		}

		function getRowContainer() {
			return rowContainer;
		}

		function selectTask(id) {
			const task = $taskStore.entities[id];

			if (task) {
				selectionManager.selectSingle(id);
			}
		}

		function unselectTasks() {
			selectionManager.unSelectTasks();
		}

		function scrollToRow(id, scrollBehavior = 'auto') {
			const { scrollTop, clientHeight } = mainContainer;
			const row = $rowStore.entities[id];

			if (!row) {
				return;
			}

			const targetTop = row.y;

			if (targetTop < scrollTop) {
				mainContainer.scrollTo({ top: targetTop, behavior: scrollBehavior });
			}

			if (targetTop > scrollTop + clientHeight) {
				mainContainer.scrollTo({
					top: targetTop + row.height - clientHeight,
					behavior: scrollBehavior
				});
			}
		}

		function scrollToTask(id, scrollBehavior = 'auto') {
			const { scrollLeft, scrollTop, clientWidth, clientHeight } = mainContainer;
			const task = $taskStore.entities[id];
			if (!task) return;
			const row = $rowStore.entities[task.model.resourceId];
			if (!row) return;
			const targetLeft = task.left;
			const targetTop = row.y;

			const options = {
				top: undefined,
				left: undefined,
				behavior: scrollBehavior
			};

			if (targetLeft < scrollLeft) {
				options.left = targetLeft;
			}

			if (targetLeft > scrollLeft + clientWidth) {
				options.left = targetLeft + task.width - clientWidth;
			}

			if (targetTop < scrollTop) {
				options.top = targetTop;
			}

			if (targetTop > scrollTop + clientHeight) {
				options.top = targetTop + row.height - clientHeight;
			}

			mainContainer.scrollTo(options);
		}

		function updateTask(model) {
			const task = createTask(model);
			taskStore.upsert(task);
			invalidatePosition({ task });
			updateLayoutSync();
		}

		function updateTasks(models) {
			const tasks = models.map(model => createTask(model));
			taskStore.upsertAll(tasks);
			tasks.forEach(task => invalidatePosition({ task }));
			updateLayoutSync();
		}

		function removeTask(taskId) {
			const task = $taskStore.entities[taskId];

			if (!task) {
				return;
			}

			taskStore.delete(taskId);
			const row = $rowStore.entities[task.model.resourceId];

			if (!row) {
				return;
			}

			invalidatePosition({ row });
			updateLayoutSync();
		}

		function removeTasks(taskIds) {
			for (const taskId of taskIds) {
				const task = $taskStore.entities[taskId];

				if (!task) {
					continue;
				}

				const row = $rowStore.entities[task.model.resourceId];

				if (!row) {
					continue;
				}

				invalidatePosition({ row });
			}

			taskStore.deleteAll(taskIds);
			updateLayoutSync();
		}

		function updateRow(model) {
			const row = createRows([model], { rowHeight });
			rowStore.upsertAll(row);
			updateLayout();
			updateLayoutSync();
		}

		function updateRows(models) {
			const rows = createRows(models, { rowHeight });
			rowStore.upsertAll(rows);
			updateLayout();
			updateLayoutSync();
		}

		function getRow(resourceId) {
			return $rowStore.entities[resourceId];
		}

		function getTask(id) {
			return $taskStore.entities[id];
		}

		function getTasks(resourceId) {
			if ($rowTaskCache[resourceId]) {
				return $rowTaskCache[resourceId].map(id => $taskStore.entities[id]);
			}

			return null;
		}

		let filteredRows = [];
		let rowsAreOfSameHeight = true;
		let rowContainerHeight = 0;
		let startIndex;
		let endIndex;
		let paddingTop = 0;
		let visibleRows = [];
		let visibleTasks; // try to keep the same order in the array as before
		let previousOrder = {};
		let layoutChanged = {};
		let refreshLayout = {};

		function updateLayoutSync(_invalidateFull) {
			const params = {
				taskStore: $taskStore,
				rowStore: $rowStore,
				rowTasks: $rowTaskCache,
				rowHeight,
				rowPadding,
				rowReflectedTasks: _reflectedTasksCache,
				invalidatedRows,
				invalidatedTasks,
				invalidateFull: _invalidateFull ?? invalidateFull
			};

			if (layout === 'overlap') {
				overlap(params);
			}

			if (layout === 'pack') {
				pack(params);
			}

			if (layout === 'expand') {
				expand(params);
			}

			$$invalidate(121, layoutChanged = {});
			$$invalidate(113, invalidateFull = false);
			$$invalidate(111, invalidatedTasks = {});
			$$invalidate(112, invalidatedRows = {});
		}

		function updateLayout() {
			$$invalidate(122, refreshLayout = {});
			$$invalidate(113, invalidateFull = true);
		}

		let { enableCreateTask = false } = $$props;

		let { onCreateTask = e => {
			const id = `creating-task-${(Math.random() + 1).toString(36).substring(2, 7)}`;
			return { id, label: ' ', ...e };
		} } = $$props;

		let { onCreatedTask = task => {
			
		} } = $$props;

		let draggingTasks = {};
		let _creatingTask = null;

		function onCreateTaskMove({ from, to, x, width, y }) {
			if (!_creatingTask) {
				// TODO:: incorrect for collapsible rows, if creating under one
				const row = $allRows.find(row => row.y < y && y < row.y + row.height);

				const resourceId = row.model.id;
				_creatingTask = createTask(onCreateTask({ resourceId, from, to }));
				taskStore.upsert(_creatingTask);

				$$invalidate(
					14,
					draggingTasks[_creatingTask.model.id] = {
						x: _creatingTask.left,
						y: _creatingTask.top,
						width: _creatingTask.width,
						resizing: true
					},
					draggingTasks
				);
			}

			$$invalidate(14, draggingTasks[_creatingTask.model.id].x = x, draggingTasks);
			$$invalidate(14, draggingTasks[_creatingTask.model.id].width = width, draggingTasks);
		}

		function onCreateTaskEnd({ from, to, x, width }) {
			_creatingTask.model.from = from;
			_creatingTask.model.to = to;
			_creatingTask.left = x;
			_creatingTask.width = width;
			taskStore.upsert(_creatingTask);
			delete draggingTasks[_creatingTask.model.id];
			onCreatedTask(_creatingTask);
			_creatingTask = null;
		}

		const dragCreateTasks = useCreateTask();

		function onChange(e) {
			if (e.detail.changes.some(c => !c.targetRow)) {
				return;
			}

			for (const change of e.detail.changes) {
				const { task, current, previous, sourceRow, targetRow } = change;

				if (!targetRow) {
					continue;
				}

				const model = task.model;

				if (targetRow) {
					api.tasks.raise.switchRow(task, targetRow, sourceRow);
				}

				const changed = previous.from != current.from || previous.to != current.to || sourceRow && sourceRow.model.id !== targetRow.model.id;

				if (changed) {
					model.from = current.from;
					model.to = current.to;
					model.resourceId = targetRow.model.id;

					const newTask = {
						...task,
						left: current.left,
						top: current.top,
						width: current.width
					};

					api.tasks.raise.change({
						task: newTask,
						sourceRow,
						targetRow,
						previousState: previous
					});

					api.tasks.raise.changed({
						task: newTask,
						sourceRow,
						targetRow,
						previousState: previous
					});

					taskStore.update(newTask);
					invalidatePosition({ row: sourceRow });
					invalidatePosition({ task: newTask });
				}
			}
		}

		function onItemsChange(e) {
			$$invalidate(14, draggingTasks = { ...e.detail.items });
		}

		function div2_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				mainHeaderContainer = $$value;
				$$invalidate(19, mainHeaderContainer);
			});
		}

		function div2_elementresize_handler() {
			$headerHeight = this.clientHeight;
			headerHeight.set($headerHeight);
		}

		function div4_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				rowContainer = $$value;
				$$invalidate(21, rowContainer);
			});
		}

		function div7_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				mainContainer = $$value;
				$$invalidate(20, mainContainer);
			});
		}

		function div7_elementresize_handler() {
			$visibleHeight = this.clientHeight;
			visibleHeight.set($visibleHeight);
			offsetHeight = this.offsetHeight;
			$visibleWidth = this.clientWidth;
			visibleWidth.set($visibleWidth);
			offsetWidth = this.offsetWidth;
			$$invalidate(11, offsetHeight);
			$$invalidate(10, offsetWidth);
		}

		function div9_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				ganttElement = $$value;
				$$invalidate(18, ganttElement);
			});
		}

		$$self.$$set = $$new_props => {
			$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
			$$invalidate(62, $$restProps = compute_rest_props($$props, omit_props_names));
			if ('rows' in $$new_props) $$invalidate(64, rows = $$new_props.rows);
			if ('tasks' in $$new_props) $$invalidate(65, tasks = $$new_props.tasks);
			if ('timeRanges' in $$new_props) $$invalidate(66, timeRanges = $$new_props.timeRanges);
			if ('rowPadding' in $$new_props) $$invalidate(67, rowPadding = $$new_props.rowPadding);
			if ('rowHeight' in $$new_props) $$invalidate(68, rowHeight = $$new_props.rowHeight);
			if ('from' in $$new_props) $$invalidate(69, from = $$new_props.from);
			if ('to' in $$new_props) $$invalidate(70, to = $$new_props.to);
			if ('minWidth' in $$new_props) $$invalidate(71, minWidth = $$new_props.minWidth);
			if ('fitWidth' in $$new_props) $$invalidate(72, fitWidth = $$new_props.fitWidth);
			if ('classes' in $$new_props) $$invalidate(3, classes = $$new_props.classes);
			if ('headers' in $$new_props) $$invalidate(1, headers = $$new_props.headers);
			if ('zoomLevels' in $$new_props) $$invalidate(73, zoomLevels = $$new_props.zoomLevels);
			if ('taskContent' in $$new_props) $$invalidate(74, taskContent = $$new_props.taskContent);
			if ('tableWidth' in $$new_props) $$invalidate(2, tableWidth = $$new_props.tableWidth);
			if ('resizeHandleWidth' in $$new_props) $$invalidate(75, resizeHandleWidth = $$new_props.resizeHandleWidth);
			if ('onTaskButtonClick' in $$new_props) $$invalidate(76, onTaskButtonClick = $$new_props.onTaskButtonClick);
			if ('dateAdapter' in $$new_props) $$invalidate(77, dateAdapter = $$new_props.dateAdapter);
			if ('magnetUnit' in $$new_props) $$invalidate(78, magnetUnit = $$new_props.magnetUnit);
			if ('magnetOffset' in $$new_props) $$invalidate(79, magnetOffset = $$new_props.magnetOffset);
			if ('columnUnit' in $$new_props) $$invalidate(0, columnUnit = $$new_props.columnUnit);
			if ('columnOffset' in $$new_props) $$invalidate(63, columnOffset = $$new_props.columnOffset);
			if ('ganttTableModules' in $$new_props) $$invalidate(4, ganttTableModules = $$new_props.ganttTableModules);
			if ('ganttBodyModules' in $$new_props) $$invalidate(5, ganttBodyModules = $$new_props.ganttBodyModules);
			if ('reflectOnParentRows' in $$new_props) $$invalidate(80, reflectOnParentRows = $$new_props.reflectOnParentRows);
			if ('reflectOnChildRows' in $$new_props) $$invalidate(81, reflectOnChildRows = $$new_props.reflectOnChildRows);
			if ('useCanvasColumns' in $$new_props) $$invalidate(6, useCanvasColumns = $$new_props.useCanvasColumns);
			if ('columnStrokeColor' in $$new_props) $$invalidate(7, columnStrokeColor = $$new_props.columnStrokeColor);
			if ('columnStrokeWidth' in $$new_props) $$invalidate(8, columnStrokeWidth = $$new_props.columnStrokeWidth);
			if ('highlightedDurations' in $$new_props) $$invalidate(82, highlightedDurations = $$new_props.highlightedDurations);
			if ('highlightColor' in $$new_props) $$invalidate(83, highlightColor = $$new_props.highlightColor);
			if ('taskElementHook' in $$new_props) $$invalidate(84, taskElementHook = $$new_props.taskElementHook);
			if ('layout' in $$new_props) $$invalidate(85, layout = $$new_props.layout);
			if ('enableCreateTask' in $$new_props) $$invalidate(9, enableCreateTask = $$new_props.enableCreateTask);
			if ('onCreateTask' in $$new_props) $$invalidate(108, onCreateTask = $$new_props.onCreateTask);
			if ('onCreatedTask' in $$new_props) $$invalidate(109, onCreatedTask = $$new_props.onCreatedTask);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty[2] & /*rows*/ 4 | $$self.$$.dirty[3] & /*mounted*/ 131072) {
				if (mounted) initRows(rows);
			}

			if ($$self.$$.dirty[2] & /*tasks*/ 8 | $$self.$$.dirty[3] & /*mounted*/ 131072) {
				if (mounted) initTasks(tasks);
			}

			if ($$self.$$.dirty[2] & /*timeRanges*/ 16 | $$self.$$.dirty[3] & /*mounted*/ 131072) {
				if (mounted) initTimeRanges(timeRanges);
			}

			if ($$self.$$.dirty[2] & /*rowHeight*/ 64) {
				set_store_value(_rowHeight, $_rowHeight = rowHeight, $_rowHeight);
			}

			if ($$self.$$.dirty[2] & /*rowPadding*/ 32) {
				set_store_value(_rowPadding, $_rowPadding = rowPadding, $_rowPadding);
			}

			if ($$self.$$.dirty[2] & /*from*/ 128) {
				set_store_value(_from, $_from = toDateNum(from), $_from);
			}

			if ($$self.$$.dirty[2] & /*to*/ 256) {
				set_store_value(_to, $_to = toDateNum(to), $_to);
			}

			if ($$self.$$.dirty[2] & /*minWidth, fitWidth*/ 1536) {
				{
					set_store_value(_minWidth, $_minWidth = minWidth, $_minWidth);
					set_store_value(_fitWidth, $_fitWidth = fitWidth, $_fitWidth);
				}
			}

			if ($$self.$$.dirty[2] & /*magnetUnit, magnetOffset*/ 196608) {
				setMagnetDuration(magnetUnit, magnetOffset);
			}

			if ($$self.$$.dirty[2] & /*layout*/ 8388608) {
				set_store_value(_layout, $_layout = layout, $_layout);
			}

			if ($$self.$$.dirty[0] & /*columnUnit, $_width*/ 65537 | $$self.$$.dirty[2] & /*columnOffset*/ 2 | $$self.$$.dirty[4] & /*$_from, $_to*/ 48) {
				{
					$$invalidate(23, columns = getColumnsV2($_from, $_to, columnUnit, columnOffset));
					tickWithoutCSSTransition();
					refreshTimeRanges();
					refreshTasks();
				}
			}

			if ($$self.$$.dirty[0] & /*offsetHeight, $visibleHeight*/ 34816) {
				set_store_value(bottomScrollbarVisible, $bottomScrollbarVisible = offsetHeight - $visibleHeight, $bottomScrollbarVisible);
			}

			if ($$self.$$.dirty[0] & /*offsetWidth, $visibleWidth*/ 132096) {
				set_store_value(rightScrollbarVisible, $rightScrollbarVisible = offsetWidth - $visibleWidth, $rightScrollbarVisible);
			}

			if ($$self.$$.dirty[2] & /*reflectOnChildRows, reflectOnParentRows*/ 786432 | $$self.$$.dirty[3] & /*_reflectedTasksCache*/ 4194304 | $$self.$$.dirty[4] & /*$allTasks, $rowStore*/ 10) {
				{
					$$invalidate(115, _reflectedTasksCache = {});

					for (const task of $allTasks) {
						const row = $rowStore.entities[task.model.resourceId];

						if (!row) {
							continue;
						}

						if (reflectOnChildRows && row.allChildren) {
							row.allChildren.forEach(r => {
								const reflectedTask = reflectTask(task, r);

								if (!_reflectedTasksCache[r.model.id]) {
									$$invalidate(115, _reflectedTasksCache[r.model.id] = [], _reflectedTasksCache);
								}

								_reflectedTasksCache[r.model.id].push(reflectedTask);
							});
						}

						if (reflectOnParentRows && row.allParents) {
							row.allParents.forEach(r => {
								const reflectedTask = reflectTask(task, r);

								if (!_reflectedTasksCache[r.model.id]) {
									$$invalidate(115, _reflectedTasksCache[r.model.id] = [], _reflectedTasksCache);
								}

								_reflectedTasksCache[r.model.id].push(reflectedTask);
							});
						}
					}
				}
			}

			if ($$self.$$.dirty[2] & /*rowHeight, rowPadding, layout*/ 8388704 | $$self.$$.dirty[3] & /*refreshLayout, _reflectedTasksCache, invalidatedRows, invalidatedTasks, invalidateFull*/ 542900224 | $$self.$$.dirty[4] & /*$taskStore, $rowStore, $rowTaskCache*/ 7) {
				/** apply layouts */
				{

					const params = {
						taskStore: $taskStore,
						rowStore: $rowStore,
						rowTasks: $rowTaskCache,
						rowHeight,
						rowPadding,
						rowReflectedTasks: _reflectedTasksCache,
						invalidatedRows,
						invalidatedTasks,
						invalidateFull
					};

					if (layout === 'overlap') {
						overlap(params);
					}

					if (layout === 'pack') {
						pack(params);
					}

					if (layout === 'expand') {
						expand(params);
					}

					$$invalidate(121, layoutChanged = {});
					$$invalidate(113, invalidateFull = false);
					$$invalidate(111, invalidatedTasks = {});
					$$invalidate(112, invalidatedRows = {});
				}
			}

			if ($$self.$$.dirty[0] & /*rowContainerHeight*/ 4096 | $$self.$$.dirty[2] & /*rowHeight*/ 64 | $$self.$$.dirty[3] & /*layoutChanged, $allRows, filteredRows*/ 1350565888) {
				{
					$$invalidate(116, filteredRows = []);
					$$invalidate(12, rowContainerHeight = 0);
					const firstRow = $allRows[0];

					for (const row of $allRows) {
						if (!row.hidden) {
							filteredRows.push(row);

							if (firstRow && firstRow.height !== row.height) {
								$$invalidate(117, rowsAreOfSameHeight = false);
							}

							$$invalidate(12, rowContainerHeight += row.height || rowHeight);
						}
					}
				}
			}

			if ($$self.$$.dirty[0] & /*rowContainerHeight*/ 4096 | $$self.$$.dirty[3] & /*rowsAreOfSameHeight, filteredRows, __scrollTop*/ 27262976) {
				{
					if (rowsAreOfSameHeight) {
						const rowHeight = rowContainerHeight / filteredRows.length;
						$$invalidate(118, startIndex = Math.floor(__scrollTop / rowHeight));
					} else {
						$$invalidate(118, startIndex = getIndicesOnly(filteredRows, __scrollTop, row => row.y)[0]);
					}
				}
			}

			if ($$self.$$.dirty[0] & /*$visibleHeight*/ 32768 | $$self.$$.dirty[2] & /*rowHeight*/ 64 | $$self.$$.dirty[3] & /*rowsAreOfSameHeight, startIndex, filteredRows, __scrollTop*/ 60817408) {
				{
					if (rowsAreOfSameHeight) {
						$$invalidate(119, endIndex = Math.min(startIndex + Math.ceil($visibleHeight / rowHeight), filteredRows.length - 1));
					} else {
						$$invalidate(119, endIndex = getIndicesOnly(filteredRows, __scrollTop + $visibleHeight, row => row.y)[0]);
					}
				}
			}

			if ($$self.$$.dirty[3] & /*filteredRows, startIndex*/ 41943040) {
				{
					$$invalidate(25, paddingTop = filteredRows[startIndex]
					? filteredRows[startIndex].y
					: 0);
				}
			}

			if ($$self.$$.dirty[3] & /*filteredRows, startIndex, endIndex*/ 109051904) {
				$$invalidate(13, visibleRows = filteredRows.slice(startIndex, endIndex + 1));
			}

			if ($$self.$$.dirty[0] & /*visibleRows, draggingTasks*/ 24576 | $$self.$$.dirty[3] & /*previousOrder, _reflectedTasksCache*/ 138412032 | $$self.$$.dirty[4] & /*$rowTaskCache, $taskStore*/ 5) {
				{
					const tasks = [];
					const rendered = {};
					const tasksOrdered = [];
					const order = {};

					// because svelte detaches html elements when their order changes (even when keyed)
					// this helps CSS transitions
					let ordered = true;

					let ordinal = 0;

					function tryRestorePosition(task) {
						if (!task) return;
						tasks.push(task);
						const id = task.model.id;

						if (previousOrder[id] != null) {
							tasksOrdered[previousOrder[id]] = task;
						} else {
							ordered = false;
						}

						order[id] = ordinal++;
					}

					for (let i = 0; i < visibleRows.length; i++) {
						const row = visibleRows[i];

						if ($rowTaskCache[row.model.id]) {
							for (let j = 0; j < $rowTaskCache[row.model.id].length; j++) {
								const id = $rowTaskCache[row.model.id][j];
								rendered[id] = true;
								tryRestorePosition($taskStore.entities[id]);
							}
						}

						if (_reflectedTasksCache[row.model.id]) {
							for (const task of _reflectedTasksCache[row.model.id]) {
								tryRestorePosition(task);
							}
						}
					}

					// render all tasks being dragged if not already
					for (const id in draggingTasks) {
						if (!rendered[id]) {
							rendered[id] = true;
							tryRestorePosition($taskStore.entities[id]);
						}
					}

					if (tasksOrdered.length !== tasks.length) {
						ordered = false;
					}

					$$invalidate(120, previousOrder = ordered ? previousOrder : order);
					$$invalidate(26, visibleTasks = ordered ? tasksOrdered : tasks);
				}
			}

			if ($$self.$$.dirty[2] & /*layout, tasks, rows*/ 8388620) {
				{
					updateLayout();
				}
			}
		};

		return [
			columnUnit,
			headers,
			tableWidth,
			classes,
			ganttTableModules,
			ganttBodyModules,
			useCanvasColumns,
			columnStrokeColor,
			columnStrokeWidth,
			enableCreateTask,
			offsetWidth,
			offsetHeight,
			rowContainerHeight,
			visibleRows,
			draggingTasks,
			$visibleHeight,
			$_width,
			$visibleWidth,
			ganttElement,
			mainHeaderContainer,
			mainContainer,
			rowContainer,
			disableTransition,
			columns,
			zooming,
			paddingTop,
			visibleTasks,
			$rightScrollbarVisible,
			$headerHeight,
			$allTimeRanges,
			_rowHeight,
			_rowPadding,
			_from,
			_to,
			_minWidth,
			_fitWidth,
			_layout,
			visibleWidth,
			visibleHeight,
			headerHeight,
			_width,
			rowStore,
			taskStore,
			allTasks,
			allRows,
			allTimeRanges,
			rowTaskCache,
			bottomScrollbarVisible,
			rightScrollbarVisible,
			hoveredRow,
			selectedRow,
			onEvent,
			scrollable,
			horizontalScrollListener,
			onResize,
			onwheel,
			onDateSelected,
			onCreateTaskMove,
			onCreateTaskEnd,
			dragCreateTasks,
			onChange,
			onItemsChange,
			$$restProps,
			columnOffset,
			rows,
			tasks,
			timeRanges,
			rowPadding,
			rowHeight,
			from,
			to,
			minWidth,
			fitWidth,
			zoomLevels,
			taskContent,
			resizeHandleWidth,
			onTaskButtonClick,
			dateAdapter,
			magnetUnit,
			magnetOffset,
			reflectOnParentRows,
			reflectOnChildRows,
			highlightedDurations,
			highlightColor,
			taskElementHook,
			layout,
			columnService,
			api,
			timeRangeFactory,
			utils,
			refreshTimeRanges,
			refreshTasks,
			getRowContainer,
			selectTask,
			unselectTasks,
			scrollToRow,
			scrollToTask,
			updateTask,
			updateTasks,
			removeTask,
			removeTasks,
			updateRow,
			updateRows,
			getRow,
			getTask,
			getTasks,
			updateLayoutSync,
			updateLayout,
			onCreateTask,
			onCreatedTask,
			mounted,
			invalidatedTasks,
			invalidatedRows,
			invalidateFull,
			__scrollTop,
			_reflectedTasksCache,
			filteredRows,
			rowsAreOfSameHeight,
			startIndex,
			endIndex,
			previousOrder,
			layoutChanged,
			refreshLayout,
			$allRows,
			$rowTaskCache,
			$rowStore,
			$taskStore,
			$allTasks,
			$_to,
			$_from,
			div2_binding,
			div2_elementresize_handler,
			div4_binding,
			div7_binding,
			div7_elementresize_handler,
			div9_binding
		];
	}

	class Gantt extends SvelteComponent {
		constructor(options) {
			super();

			init(
				this,
				options,
				instance$5,
				create_fragment$5,
				safe_not_equal,
				{
					rows: 64,
					tasks: 65,
					timeRanges: 66,
					rowPadding: 67,
					rowHeight: 68,
					from: 69,
					to: 70,
					minWidth: 71,
					fitWidth: 72,
					classes: 3,
					headers: 1,
					zoomLevels: 73,
					taskContent: 74,
					tableWidth: 2,
					resizeHandleWidth: 75,
					onTaskButtonClick: 76,
					dateAdapter: 77,
					magnetUnit: 78,
					magnetOffset: 79,
					columnUnit: 0,
					columnOffset: 63,
					ganttTableModules: 4,
					ganttBodyModules: 5,
					reflectOnParentRows: 80,
					reflectOnChildRows: 81,
					useCanvasColumns: 6,
					columnStrokeColor: 7,
					columnStrokeWidth: 8,
					highlightedDurations: 82,
					highlightColor: 83,
					taskElementHook: 84,
					layout: 85,
					columnService: 86,
					api: 87,
					timeRangeFactory: 88,
					utils: 89,
					refreshTimeRanges: 90,
					refreshTasks: 91,
					getRowContainer: 92,
					selectTask: 93,
					unselectTasks: 94,
					scrollToRow: 95,
					scrollToTask: 96,
					updateTask: 97,
					updateTasks: 98,
					removeTask: 99,
					removeTasks: 100,
					updateRow: 101,
					updateRows: 102,
					getRow: 103,
					getTask: 104,
					getTasks: 105,
					updateLayoutSync: 106,
					updateLayout: 107,
					enableCreateTask: 9,
					onCreateTask: 108,
					onCreatedTask: 109
				},
				null,
				[-1, -1, -1, -1, -1, -1]
			);
		}

		get columnService() {
			return this.$$.ctx[86];
		}

		get api() {
			return this.$$.ctx[87];
		}

		get timeRangeFactory() {
			return this.$$.ctx[88];
		}

		get utils() {
			return this.$$.ctx[89];
		}

		get refreshTimeRanges() {
			return this.$$.ctx[90];
		}

		get refreshTasks() {
			return this.$$.ctx[91];
		}

		get getRowContainer() {
			return this.$$.ctx[92];
		}

		get selectTask() {
			return this.$$.ctx[93];
		}

		get unselectTasks() {
			return this.$$.ctx[94];
		}

		get scrollToRow() {
			return this.$$.ctx[95];
		}

		get scrollToTask() {
			return this.$$.ctx[96];
		}

		get updateTask() {
			return this.$$.ctx[97];
		}

		get updateTasks() {
			return this.$$.ctx[98];
		}

		get removeTask() {
			return this.$$.ctx[99];
		}

		get removeTasks() {
			return this.$$.ctx[100];
		}

		get updateRow() {
			return this.$$.ctx[101];
		}

		get updateRows() {
			return this.$$.ctx[102];
		}

		get getRow() {
			return this.$$.ctx[103];
		}

		get getTask() {
			return this.$$.ctx[104];
		}

		get getTasks() {
			return this.$$.ctx[105];
		}

		get updateLayoutSync() {
			return this.$$.ctx[106];
		}

		get updateLayout() {
			return this.$$.ctx[107];
		}
	}

	var css_248z$4 = ".sg-tree-expander.svelte-1tk4vqn{cursor:pointer;min-width:1.4em;display:flex;justify-content:center;align-items:center}.sg-cell-inner.svelte-1tk4vqn{display:flex}";
	styleInject(css_248z$4);

	/* src/modules/table/TableTreeCell.svelte generated by Svelte v4.2.19 */

	function create_if_block$2(ctx) {
		let div;
		let mounted;
		let dispose;

		function select_block_type(ctx, dirty) {
			if (/*row*/ ctx[0].model.expanded) return create_if_block_1$1;
			return create_else_block$1;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		return {
			c() {
				div = element("div");
				if_block.c();
				attr(div, "class", "sg-tree-expander svelte-1tk4vqn");
				attr(div, "role", "button");
				attr(div, "tabindex", "0");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				if_block.m(div, null);

				if (!mounted) {
					dispose = listen(div, "click", /*onExpandToggle*/ ctx[1]);
					mounted = true;
				}
			},
			p(ctx, dirty) {
				if (current_block_type !== (current_block_type = select_block_type(ctx))) {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(div, null);
					}
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				if_block.d();
				mounted = false;
				dispose();
			}
		};
	}

	// (19:12) {:else}
	function create_else_block$1(ctx) {
		let i;

		return {
			c() {
				i = element("i");
				attr(i, "class", "fas fa-angle-right");
			},
			m(target, anchor) {
				insert(target, i, anchor);
			},
			d(detaching) {
				if (detaching) {
					detach(i);
				}
			}
		};
	}

	// (17:12) {#if row.model.expanded}
	function create_if_block_1$1(ctx) {
		let i;

		return {
			c() {
				i = element("i");
				attr(i, "class", "fas fa-angle-down");
			},
			m(target, anchor) {
				insert(target, i, anchor);
			},
			d(detaching) {
				if (detaching) {
					detach(i);
				}
			}
		};
	}

	function create_fragment$4(ctx) {
		let div;
		let t;
		let current;
		let if_block = /*row*/ ctx[0].children && create_if_block$2(ctx);
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

		return {
			c() {
				div = element("div");
				if (if_block) if_block.c();
				t = space();
				if (default_slot) default_slot.c();
				attr(div, "class", "sg-cell-inner svelte-1tk4vqn");
				set_style(div, "padding-left", /*row*/ ctx[0].childLevel * 3 + "em");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				if (if_block) if_block.m(div, null);
				append(div, t);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p(ctx, [dirty]) {
				if (/*row*/ ctx[0].children) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						if_block.m(div, t);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*row*/ 1) {
					set_style(div, "padding-left", /*row*/ ctx[0].childLevel * 3 + "em");
				}
			},
			i(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				if (if_block) if_block.d();
				if (default_slot) default_slot.d(detaching);
			}
		};
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		let { row } = $$props;
		const dispatch = createEventDispatcher();

		function onExpandToggle() {
			if (row.model.expanded || row.model.expanded == null) {
				dispatch('rowCollapsed', { row });
			} else {
				dispatch('rowExpanded', { row });
			}
		}

		$$self.$$set = $$props => {
			if ('row' in $$props) $$invalidate(0, row = $$props.row);
			if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
		};

		return [row, onExpandToggle, $$scope, slots];
	}

	class TableTreeCell extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { row: 0 });
		}
	}

	var css_248z$3 = ".sg-table-row.svelte-1puymdp.svelte-1puymdp{display:inline-flex;min-width:100%;align-items:stretch;position:relative;font-weight:400;font-size:14px;transition:height 0.2s}.sg-table-cell.svelte-1puymdp.svelte-1puymdp{border-right:1px solid #eee}.sg-table-cell.svelte-1puymdp.svelte-1puymdp:last-child{border-right:0}.sg-table-body-cell.svelte-1puymdp.svelte-1puymdp{border-bottom:#efefef 1px solid;background-color:#fff;font-weight:bold}.sg-table-row.svelte-1puymdp:last-child>.sg-table-body-cell.svelte-1puymdp{border-bottom:0}.sg-resource-image.svelte-1puymdp.svelte-1puymdp{width:2.4em;height:2.4em;border-radius:50%;margin-right:0.6em;background:#047c69}.sg-resource-info.svelte-1puymdp.svelte-1puymdp{flex:1;height:100%;display:flex;flex-direction:row;align-items:center}.sg-table-icon.svelte-1puymdp.svelte-1puymdp{margin-right:0.5em}";
	styleInject(css_248z$3);

	/* src/modules/table/TableRow.svelte generated by Svelte v4.2.19 */

	function get_each_context$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[10] = list[i];
		return child_ctx;
	}

	// (40:12) {:else}
	function create_else_block_1(ctx) {
		let t;
		let if_block1_anchor;
		let if_block0 = /*row*/ ctx[1].model.iconClass && create_if_block_7(ctx);

		function select_block_type_2(ctx, dirty) {
			if (/*row*/ ctx[1].model.headerHtml) return create_if_block_4;
			if (/*header*/ ctx[10].renderer) return create_if_block_5;
			if (/*header*/ ctx[10].type === 'resourceInfo') return create_if_block_6;
			return create_else_block_2;
		}

		let current_block_type = select_block_type_2(ctx);
		let if_block1 = current_block_type(ctx);

		return {
			c() {
				if (if_block0) if_block0.c();
				t = space();
				if_block1.c();
				if_block1_anchor = empty();
			},
			m(target, anchor) {
				if (if_block0) if_block0.m(target, anchor);
				insert(target, t, anchor);
				if_block1.m(target, anchor);
				insert(target, if_block1_anchor, anchor);
			},
			p(ctx, dirty) {
				if (/*row*/ ctx[1].model.iconClass) {
					if (if_block0) {
						if_block0.p(ctx, dirty);
					} else {
						if_block0 = create_if_block_7(ctx);
						if_block0.c();
						if_block0.m(t.parentNode, t);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1.d(1);
					if_block1 = current_block_type(ctx);

					if (if_block1) {
						if_block1.c();
						if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
					}
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(t);
					detach(if_block1_anchor);
				}

				if (if_block0) if_block0.d(detaching);
				if_block1.d(detaching);
			}
		};
	}

	// (24:12) {#if header.type == 'tree'}
	function create_if_block$1(ctx) {
		let tabletreecell;
		let current;

		tabletreecell = new TableTreeCell({
				props: {
					row: /*row*/ ctx[1],
					$$slots: { default: [create_default_slot] },
					$$scope: { ctx }
				}
			});

		tabletreecell.$on("rowCollapsed", /*rowCollapsed_handler*/ ctx[7]);
		tabletreecell.$on("rowExpanded", /*rowExpanded_handler*/ ctx[8]);

		return {
			c() {
				create_component(tabletreecell.$$.fragment);
			},
			m(target, anchor) {
				mount_component(tabletreecell, target, anchor);
				current = true;
			},
			p(ctx, dirty) {
				const tabletreecell_changes = {};
				if (dirty & /*row*/ 2) tabletreecell_changes.row = /*row*/ ctx[1];

				if (dirty & /*$$scope, row, headers*/ 8195) {
					tabletreecell_changes.$$scope = { dirty, ctx };
				}

				tabletreecell.$set(tabletreecell_changes);
			},
			i(local) {
				if (current) return;
				transition_in(tabletreecell.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(tabletreecell.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				destroy_component(tabletreecell, detaching);
			}
		};
	}

	// (41:16) {#if row.model.iconClass}
	function create_if_block_7(ctx) {
		let div;
		let i;
		let i_class_value;

		return {
			c() {
				div = element("div");
				i = element("i");
				attr(i, "class", i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-1puymdp"));
				attr(div, "class", "sg-table-icon svelte-1puymdp");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				append(div, i);
			},
			p(ctx, dirty) {
				if (dirty & /*row*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-1puymdp"))) {
					attr(i, "class", i_class_value);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (56:16) {:else}
	function create_else_block_2(ctx) {
		let t_value = /*row*/ ctx[1].model[/*header*/ ctx[10].property] + "";
		let t;

		return {
			c() {
				t = text(t_value);
			},
			m(target, anchor) {
				insert(target, t, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*row, headers*/ 3 && t_value !== (t_value = /*row*/ ctx[1].model[/*header*/ ctx[10].property] + "")) set_data(t, t_value);
			},
			d(detaching) {
				if (detaching) {
					detach(t);
				}
			}
		};
	}

	// (51:57) 
	function create_if_block_6(ctx) {
		let img;
		let img_src_value;
		let t0;
		let div;
		let t1_value = /*row*/ ctx[1].model[/*header*/ ctx[10].property] + "";
		let t1;

		return {
			c() {
				img = element("img");
				t0 = space();
				div = element("div");
				t1 = text(t1_value);
				attr(img, "class", "sg-resource-image svelte-1puymdp");
				if (!src_url_equal(img.src, img_src_value = /*row*/ ctx[1].model.imageSrc)) attr(img, "src", img_src_value);
				attr(img, "alt", "");
				attr(div, "class", "sg-resource-title");
			},
			m(target, anchor) {
				insert(target, img, anchor);
				insert(target, t0, anchor);
				insert(target, div, anchor);
				append(div, t1);
			},
			p(ctx, dirty) {
				if (dirty & /*row*/ 2 && !src_url_equal(img.src, img_src_value = /*row*/ ctx[1].model.imageSrc)) {
					attr(img, "src", img_src_value);
				}

				if (dirty & /*row, headers*/ 3 && t1_value !== (t1_value = /*row*/ ctx[1].model[/*header*/ ctx[10].property] + "")) set_data(t1, t1_value);
			},
			d(detaching) {
				if (detaching) {
					detach(img);
					detach(t0);
					detach(div);
				}
			}
		};
	}

	// (49:42) 
	function create_if_block_5(ctx) {
		let html_tag;
		let raw_value = /*header*/ ctx[10].renderer(/*row*/ ctx[1]) + "";
		let html_anchor;

		return {
			c() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert(target, html_anchor, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*headers, row*/ 3 && raw_value !== (raw_value = /*header*/ ctx[10].renderer(/*row*/ ctx[1]) + "")) html_tag.p(raw_value);
			},
			d(detaching) {
				if (detaching) {
					detach(html_anchor);
					html_tag.d();
				}
			}
		};
	}

	// (47:16) {#if row.model.headerHtml}
	function create_if_block_4(ctx) {
		let html_tag;
		let raw_value = /*row*/ ctx[1].model.headerHtml + "";
		let html_anchor;

		return {
			c() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert(target, html_anchor, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*row*/ 2 && raw_value !== (raw_value = /*row*/ ctx[1].model.headerHtml + "")) html_tag.p(raw_value);
			},
			d(detaching) {
				if (detaching) {
					detach(html_anchor);
					html_tag.d();
				}
			}
		};
	}

	// (26:20) {#if row.model.iconClass}
	function create_if_block_3(ctx) {
		let div;
		let i;
		let i_class_value;

		return {
			c() {
				div = element("div");
				i = element("i");
				attr(i, "class", i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-1puymdp"));
				attr(div, "class", "sg-table-icon svelte-1puymdp");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				append(div, i);
			},
			p(ctx, dirty) {
				if (dirty & /*row*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*row*/ ctx[1].model.iconClass) + " svelte-1puymdp"))) {
					attr(i, "class", i_class_value);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (36:20) {:else}
	function create_else_block(ctx) {
		let t_value = /*row*/ ctx[1].model[/*header*/ ctx[10].property] + "";
		let t;

		return {
			c() {
				t = text(t_value);
			},
			m(target, anchor) {
				insert(target, t, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*row, headers*/ 3 && t_value !== (t_value = /*row*/ ctx[1].model[/*header*/ ctx[10].property] + "")) set_data(t, t_value);
			},
			d(detaching) {
				if (detaching) {
					detach(t);
				}
			}
		};
	}

	// (34:46) 
	function create_if_block_2(ctx) {
		let html_tag;
		let raw_value = /*header*/ ctx[10].renderer(/*row*/ ctx[1]) + "";
		let html_anchor;

		return {
			c() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert(target, html_anchor, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*headers, row*/ 3 && raw_value !== (raw_value = /*header*/ ctx[10].renderer(/*row*/ ctx[1]) + "")) html_tag.p(raw_value);
			},
			d(detaching) {
				if (detaching) {
					detach(html_anchor);
					html_tag.d();
				}
			}
		};
	}

	// (32:20) {#if row.model.headerHtml}
	function create_if_block_1(ctx) {
		let html_tag;
		let raw_value = /*row*/ ctx[1].model.headerHtml + "";
		let html_anchor;

		return {
			c() {
				html_tag = new HtmlTag(false);
				html_anchor = empty();
				html_tag.a = html_anchor;
			},
			m(target, anchor) {
				html_tag.m(raw_value, target, anchor);
				insert(target, html_anchor, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*row*/ 2 && raw_value !== (raw_value = /*row*/ ctx[1].model.headerHtml + "")) html_tag.p(raw_value);
			},
			d(detaching) {
				if (detaching) {
					detach(html_anchor);
					html_tag.d();
				}
			}
		};
	}

	// (25:16) <TableTreeCell on:rowCollapsed on:rowExpanded {row}>
	function create_default_slot(ctx) {
		let t;
		let if_block1_anchor;
		let if_block0 = /*row*/ ctx[1].model.iconClass && create_if_block_3(ctx);

		function select_block_type_1(ctx, dirty) {
			if (/*row*/ ctx[1].model.headerHtml) return create_if_block_1;
			if (/*header*/ ctx[10].renderer) return create_if_block_2;
			return create_else_block;
		}

		let current_block_type = select_block_type_1(ctx);
		let if_block1 = current_block_type(ctx);

		return {
			c() {
				if (if_block0) if_block0.c();
				t = space();
				if_block1.c();
				if_block1_anchor = empty();
			},
			m(target, anchor) {
				if (if_block0) if_block0.m(target, anchor);
				insert(target, t, anchor);
				if_block1.m(target, anchor);
				insert(target, if_block1_anchor, anchor);
			},
			p(ctx, dirty) {
				if (/*row*/ ctx[1].model.iconClass) {
					if (if_block0) {
						if_block0.p(ctx, dirty);
					} else {
						if_block0 = create_if_block_3(ctx);
						if_block0.c();
						if_block0.m(t.parentNode, t);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1.d(1);
					if_block1 = current_block_type(ctx);

					if (if_block1) {
						if_block1.c();
						if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
					}
				}
			},
			d(detaching) {
				if (detaching) {
					detach(t);
					detach(if_block1_anchor);
				}

				if (if_block0) if_block0.d(detaching);
				if_block1.d(detaching);
			}
		};
	}

	// (22:4) {#each headers as header}
	function create_each_block$2(ctx) {
		let div;
		let current_block_type_index;
		let if_block;
		let t;
		let current;
		const if_block_creators = [create_if_block$1, create_else_block_1];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*header*/ ctx[10].type == 'tree') return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		return {
			c() {
				div = element("div");
				if_block.c();
				t = space();
				attr(div, "class", "sg-table-body-cell sg-table-cell svelte-1puymdp");
				set_style(div, "width", /*header*/ ctx[10].width + "px");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				if_blocks[current_block_type_index].m(div, null);
				append(div, t);
				current = true;
			},
			p(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(div, t);
				}

				if (!current || dirty & /*headers*/ 1) {
					set_style(div, "width", /*header*/ ctx[10].width + "px");
				}
			},
			i(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o(local) {
				transition_out(if_block);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				if_blocks[current_block_type_index].d();
			}
		};
	}

	function create_fragment$3(ctx) {
		let div;
		let div_data_row_id_value;
		let div_class_value;
		let current;
		let each_value = ensure_array_like(/*headers*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		return {
			c() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(div, "data-row-id", div_data_row_id_value = /*row*/ ctx[1].model.id);
				set_style(div, "height", /*row*/ ctx[1].height + "px");
				attr(div, "class", div_class_value = "sg-table-row " + /*classes*/ ctx[2] + " sg-table-row-level-" + /*row*/ ctx[1].childLevel + " svelte-1puymdp");
				toggle_class(div, "sg-row-expanded", /*row*/ ctx[1].model.expanded);
				toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[3] == /*row*/ ctx[1].model.id);
				toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[4] == /*row*/ ctx[1].model.id);
			},
			m(target, anchor) {
				insert(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}

				current = true;
			},
			p(ctx, [dirty]) {
				if (dirty & /*headers, row*/ 3) {
					each_value = ensure_array_like(/*headers*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$2(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(div, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}

				if (!current || dirty & /*row*/ 2 && div_data_row_id_value !== (div_data_row_id_value = /*row*/ ctx[1].model.id)) {
					attr(div, "data-row-id", div_data_row_id_value);
				}

				if (!current || dirty & /*row*/ 2) {
					set_style(div, "height", /*row*/ ctx[1].height + "px");
				}

				if (!current || dirty & /*classes, row*/ 6 && div_class_value !== (div_class_value = "sg-table-row " + /*classes*/ ctx[2] + " sg-table-row-level-" + /*row*/ ctx[1].childLevel + " svelte-1puymdp")) {
					attr(div, "class", div_class_value);
				}

				if (!current || dirty & /*classes, row, row*/ 6) {
					toggle_class(div, "sg-row-expanded", /*row*/ ctx[1].model.expanded);
				}

				if (!current || dirty & /*classes, row, $hoveredRow, row*/ 14) {
					toggle_class(div, "sg-hover", /*$hoveredRow*/ ctx[3] == /*row*/ ctx[1].model.id);
				}

				if (!current || dirty & /*classes, row, $selectedRow, row*/ 22) {
					toggle_class(div, "sg-selected", /*$selectedRow*/ ctx[4] == /*row*/ ctx[1].model.id);
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		let classes;
		let $hoveredRow;
		let $selectedRow;
		let { headers = null } = $$props;
		let { row = null } = $$props;
		const { hoveredRow, selectedRow } = getContext('gantt');
		component_subscribe($$self, hoveredRow, value => $$invalidate(3, $hoveredRow = value));
		component_subscribe($$self, selectedRow, value => $$invalidate(4, $selectedRow = value));

		function rowCollapsed_handler(event) {
			bubble.call(this, $$self, event);
		}

		function rowExpanded_handler(event) {
			bubble.call(this, $$self, event);
		}

		$$self.$$set = $$props => {
			if ('headers' in $$props) $$invalidate(0, headers = $$props.headers);
			if ('row' in $$props) $$invalidate(1, row = $$props.row);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*row*/ 2) {
				{
					row.parent
					? `padding-left: ${row.childLevel * 3}em;`
					: '';
				}
			}

			if ($$self.$$.dirty & /*row*/ 2) {
				$$invalidate(2, classes = normalizeClassAttr(row.model.classes));
			}
		};

		return [
			headers,
			row,
			classes,
			$hoveredRow,
			$selectedRow,
			hoveredRow,
			selectedRow,
			rowCollapsed_handler,
			rowExpanded_handler
		];
	}

	class TableRow extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$3, create_fragment$3, safe_not_equal, { headers: 0, row: 1 });
		}
	}

	var css_248z$2 = ".sg-table.svelte-1pxxfqb{overflow-x:auto;display:flex;flex-direction:column}.sg-table-scroller.svelte-1pxxfqb{width:100%;overflow-y:hidden}.sg-table-header.svelte-1pxxfqb{display:flex;align-items:stretch;overflow:hidden;border-bottom:#efefef 1px solid;background-color:#fbfbfb}.sg-table-body.svelte-1pxxfqb{display:flex;flex:1 1 0;width:100%;overflow-y:hidden}.sg-table-header-cell.svelte-1pxxfqb{font-size:14px;font-weight:400}.sg-table-cell{white-space:nowrap;overflow:hidden;display:flex;align-items:center;flex-shrink:0;padding:0 0.5em;height:100%}.sg-table-cell:last-child{flex-grow:1}";
	styleInject(css_248z$2);

	/* src/modules/table/Table.svelte generated by Svelte v4.2.19 */

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[22] = list[i];
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[25] = list[i];
		return child_ctx;
	}

	// (77:8) {#each tableHeaders as header}
	function create_each_block_1(ctx) {
		let div;
		let t0_value = /*header*/ ctx[25].title + "";
		let t0;
		let t1;

		return {
			c() {
				div = element("div");
				t0 = text(t0_value);
				t1 = space();
				attr(div, "class", "sg-table-header-cell sg-table-cell svelte-1pxxfqb");
				set_style(div, "width", /*header*/ ctx[25].width + "px");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				append(div, t0);
				append(div, t1);
			},
			p(ctx, dirty) {
				if (dirty & /*tableHeaders*/ 16 && t0_value !== (t0_value = /*header*/ ctx[25].title + "")) set_data(t0, t0_value);

				if (dirty & /*tableHeaders*/ 16) {
					set_style(div, "width", /*header*/ ctx[25].width + "px");
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (90:16) {#each visibleRows as row}
	function create_each_block$1(ctx) {
		let tablerow;
		let current;

		tablerow = new TableRow({
				props: {
					row: /*row*/ ctx[22],
					headers: /*tableHeaders*/ ctx[4]
				}
			});

		tablerow.$on("rowExpanded", /*onRowExpanded*/ ctx[11]);
		tablerow.$on("rowCollapsed", /*onRowCollapsed*/ ctx[12]);

		return {
			c() {
				create_component(tablerow.$$.fragment);
			},
			m(target, anchor) {
				mount_component(tablerow, target, anchor);
				current = true;
			},
			p(ctx, dirty) {
				const tablerow_changes = {};
				if (dirty & /*visibleRows*/ 8) tablerow_changes.row = /*row*/ ctx[22];
				if (dirty & /*tableHeaders*/ 16) tablerow_changes.headers = /*tableHeaders*/ ctx[4];
				tablerow.$set(tablerow_changes);
			},
			i(local) {
				if (current) return;
				transition_in(tablerow.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(tablerow.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				destroy_component(tablerow, detaching);
			}
		};
	}

	function create_fragment$2(ctx) {
		let div4;
		let div0;
		let t;
		let div3;
		let div2;
		let div1;
		let div3_style_value;
		let current;
		let mounted;
		let dispose;
		let each_value_1 = ensure_array_like(/*tableHeaders*/ ctx[4]);
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		let each_value = ensure_array_like(/*visibleRows*/ ctx[3]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		return {
			c() {
				div4 = element("div");
				div0 = element("div");

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t = space();
				div3 = element("div");
				div2 = element("div");
				div1 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(div0, "class", "sg-table-header svelte-1pxxfqb");
				set_style(div0, "height", /*$headerHeight*/ ctx[6] + "px");
				attr(div1, "class", "sg-table-rows");
				set_style(div1, "padding-top", /*paddingTop*/ ctx[1] + "px");
				set_style(div1, "height", /*rowContainerHeight*/ ctx[2] + "px");
				attr(div2, "class", "sg-table-scroller svelte-1pxxfqb");
				attr(div3, "class", "sg-table-body svelte-1pxxfqb");
				attr(div3, "style", div3_style_value = `padding-bottom: ${/*$bottomScrollbarVisible*/ ctx[7]}px;`);
				attr(div4, "class", "sg-table sg-view svelte-1pxxfqb");
				set_style(div4, "width", /*tableWidth*/ ctx[0] + "px");
			},
			m(target, anchor) {
				insert(target, div4, anchor);
				append(div4, div0);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(div0, null);
					}
				}

				/*div0_binding*/ ctx[13](div0);
				append(div4, t);
				append(div4, div3);
				append(div3, div2);
				append(div2, div1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div1, null);
					}
				}

				current = true;

				if (!mounted) {
					dispose = action_destroyer(/*scrollListener*/ ctx[10].call(null, div2));
					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*tableHeaders*/ 16) {
					each_value_1 = ensure_array_like(/*tableHeaders*/ ctx[4]);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_1(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(div0, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_1.length;
				}

				if (!current || dirty & /*$headerHeight*/ 64) {
					set_style(div0, "height", /*$headerHeight*/ ctx[6] + "px");
				}

				if (dirty & /*visibleRows, tableHeaders, onRowExpanded, onRowCollapsed*/ 6168) {
					each_value = ensure_array_like(/*visibleRows*/ ctx[3]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(div1, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}

				if (!current || dirty & /*paddingTop*/ 2) {
					set_style(div1, "padding-top", /*paddingTop*/ ctx[1] + "px");
				}

				if (!current || dirty & /*rowContainerHeight*/ 4) {
					set_style(div1, "height", /*rowContainerHeight*/ ctx[2] + "px");
				}

				if (!current || dirty & /*$bottomScrollbarVisible*/ 128 && div3_style_value !== (div3_style_value = `padding-bottom: ${/*$bottomScrollbarVisible*/ ctx[7]}px;`)) {
					attr(div3, "style", div3_style_value);
				}

				if (!current || dirty & /*tableWidth*/ 1) {
					set_style(div4, "width", /*tableWidth*/ ctx[0] + "px");
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div4);
				}

				destroy_each(each_blocks_1, detaching);
				/*div0_binding*/ ctx[13](null);
				destroy_each(each_blocks, detaching);
				mounted = false;
				dispose();
			}
		};
	}

	function hide(children) {
		for (const row of children) {
			if (row.children) hide(row.children);
			row.hidden = true;
		}
	}

	function show(children, hidden = false) {
		for (const row of children) {
			if (row.children) show(row.children, !row.model.expanded);
			row.hidden = hidden;
		}
	}

	function instance$2($$self, $$props, $$invalidate) {
		let $headerHeight;
		let $bottomScrollbarVisible;
		const dispatch = createEventDispatcher();
		let { tableWidth } = $$props;
		let { paddingTop } = $$props;
		let { rowContainerHeight } = $$props;
		let { visibleRows } = $$props;

		let { tableHeaders = [
			{
				title: 'Name',
				property: 'label',
				width: 100
			}
		] } = $$props;

		const { headerHeight, bottomScrollbarVisible } = getContext('dimensions');
		component_subscribe($$self, headerHeight, value => $$invalidate(6, $headerHeight = value));
		component_subscribe($$self, bottomScrollbarVisible, value => $$invalidate(7, $bottomScrollbarVisible = value));
		getContext('options');
		getContext('dataStore');
		const { scrollables, updateLayout } = getContext('gantt');

		onMount(() => {
			dispatch('init', { module: this });
		});

		let headerContainer;

		function scrollListener(node) {
			scrollables.push({ node, orientation: 'vertical' });

			function onScroll(event) {
				$$invalidate(5, headerContainer.scrollLeft = node.scrollLeft, headerContainer);
			}

			node.addEventListener('scroll', onScroll);

			return {
				destroy() {
					node.removeEventListener('scroll', onScroll);
				}
			};
		}

		function onRowExpanded(event) {
			const row = event.detail.row;
			row.model.expanded = true;
			if (row.children) show(row.children);
			updateLayout();
		}

		function onRowCollapsed(event) {
			const row = event.detail.row;
			row.model.expanded = false;
			if (row.children) hide(row.children);
			updateLayout();
		}

		function div0_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				headerContainer = $$value;
				$$invalidate(5, headerContainer);
			});
		}

		$$self.$$set = $$props => {
			if ('tableWidth' in $$props) $$invalidate(0, tableWidth = $$props.tableWidth);
			if ('paddingTop' in $$props) $$invalidate(1, paddingTop = $$props.paddingTop);
			if ('rowContainerHeight' in $$props) $$invalidate(2, rowContainerHeight = $$props.rowContainerHeight);
			if ('visibleRows' in $$props) $$invalidate(3, visibleRows = $$props.visibleRows);
			if ('tableHeaders' in $$props) $$invalidate(4, tableHeaders = $$props.tableHeaders);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*tableHeaders*/ 16) {
				{
					let sum = 0;

					tableHeaders.forEach(header => {
						sum += header.width;
					});
				}
			}
		};

		return [
			tableWidth,
			paddingTop,
			rowContainerHeight,
			visibleRows,
			tableHeaders,
			headerContainer,
			$headerHeight,
			$bottomScrollbarVisible,
			headerHeight,
			bottomScrollbarVisible,
			scrollListener,
			onRowExpanded,
			onRowCollapsed,
			div0_binding
		];
	}

	class Table extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$2, create_fragment$2, safe_not_equal, {
				tableWidth: 0,
				paddingTop: 1,
				rowContainerHeight: 2,
				visibleRows: 3,
				tableHeaders: 4
			});
		}
	}

	var SvelteGanttTable = Table;

	var css_248z$1 = ".sg-dependency.svelte-12syssu{position:absolute;width:100%;height:100%}.arrow.svelte-12syssu{position:absolute;left:0px;pointer-events:none}.select-area.svelte-12syssu{pointer-events:visible;position:absolute}";
	styleInject(css_248z$1);

	/* src/modules/dependencies/Dependency.svelte generated by Svelte v4.2.19 */

	function create_if_block(ctx) {
		let div;
		let svg;
		let path0;
		let path1;

		return {
			c() {
				div = element("div");
				svg = svg_element("svg");
				path0 = svg_element("path");
				path1 = svg_element("path");
				attr(path0, "class", "select-area svelte-12syssu");
				attr(path0, "d", /*path*/ ctx[6]);
				attr(path0, "stroke", /*stroke*/ ctx[1]);
				attr(path0, "stroke-width", /*strokeWidth*/ ctx[2]);
				attr(path0, "fill", "transparent");
				attr(path1, "d", /*arrowPath*/ ctx[5]);
				attr(path1, "fill", /*stroke*/ ctx[1]);
				attr(svg, "class", "arrow svelte-12syssu");
				attr(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg, "shape-rendering", "crispEdges");
				attr(svg, "height", "100%");
				attr(svg, "width", "100%");
				attr(div, "class", "sg-dependency svelte-12syssu");
				set_style(div, "left", "0");
				set_style(div, "top", "0");
				attr(div, "data-dependency-id", /*id*/ ctx[0]);
			},
			m(target, anchor) {
				insert(target, div, anchor);
				append(div, svg);
				append(svg, path0);
				append(svg, path1);
			},
			p(ctx, dirty) {
				if (dirty & /*path*/ 64) {
					attr(path0, "d", /*path*/ ctx[6]);
				}

				if (dirty & /*stroke*/ 2) {
					attr(path0, "stroke", /*stroke*/ ctx[1]);
				}

				if (dirty & /*strokeWidth*/ 4) {
					attr(path0, "stroke-width", /*strokeWidth*/ ctx[2]);
				}

				if (dirty & /*arrowPath*/ 32) {
					attr(path1, "d", /*arrowPath*/ ctx[5]);
				}

				if (dirty & /*stroke*/ 2) {
					attr(path1, "fill", /*stroke*/ ctx[1]);
				}

				if (dirty & /*id*/ 1) {
					attr(div, "data-dependency-id", /*id*/ ctx[0]);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment$1(ctx) {
		let if_block_anchor;
		let if_block = (!/*isFromRowHidden*/ ctx[3] && !/*isToRowHidden*/ ctx[4] || /*isFromRowHidden*/ ctx[3] !== /*isToRowHidden*/ ctx[4]) && create_if_block(ctx);

		return {
			c() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			m(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},
			p(ctx, [dirty]) {
				if (!/*isFromRowHidden*/ ctx[3] && !/*isToRowHidden*/ ctx[4] || /*isFromRowHidden*/ ctx[3] !== /*isToRowHidden*/ ctx[4]) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};
	}

	const MIN_LEN = 12;
	const ARROW_SIZE = 5;

	function instance$1($$self, $$props, $$invalidate) {
		let $rowStore;
		let $taskStore;
		const { rowStore, taskStore } = getContext('dataStore');
		component_subscribe($$self, rowStore, value => $$invalidate(13, $rowStore = value));
		component_subscribe($$self, taskStore, value => $$invalidate(14, $taskStore = value));
		let { id } = $$props;
		let { fromId } = $$props;
		let { toId } = $$props;
		let { stroke = 'red' } = $$props;
		let { strokeWidth = 2 } = $$props;
		let arrowPath;
		let path;
		let fromTask;
		let isFromRowHidden;
		let toTask;
		let isToRowHidden;

		$$self.$$set = $$props => {
			if ('id' in $$props) $$invalidate(0, id = $$props.id);
			if ('fromId' in $$props) $$invalidate(9, fromId = $$props.fromId);
			if ('toId' in $$props) $$invalidate(10, toId = $$props.toId);
			if ('stroke' in $$props) $$invalidate(1, stroke = $$props.stroke);
			if ('strokeWidth' in $$props) $$invalidate(2, strokeWidth = $$props.strokeWidth);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*$taskStore, fromId, $rowStore, fromTask, toId, toTask, isFromRowHidden, path, isToRowHidden*/ 32344) {
				{
					$$invalidate(11, fromTask = $taskStore.entities[fromId]);
					$$invalidate(3, isFromRowHidden = $rowStore.entities[fromTask.model.resourceId].hidden);
					$$invalidate(12, toTask = $taskStore.entities[toId]);
					$$invalidate(4, isToRowHidden = $rowStore.entities[toTask.model.resourceId].hidden);
					let startY = fromTask.top + fromTask.height / 2;
					let startX = fromTask.left + fromTask.width;
					let endY = toTask.top + toTask.height / 2;
					let endX = toTask.left;
					let width = endX - startX;
					let height = endY - startY;

					if (isFromRowHidden) {
						$$invalidate(6, path = `M${endX} ${endY}`);

						if (startX + MIN_LEN >= endX && startY != endY) {
							$$invalidate(6, path += `L ${endX + 1.5 - MIN_LEN} ${endY}`);
						} else {
							$$invalidate(6, path += `L ${endX + 1.5 - width / 2} ${endY}`);
						}

						$$invalidate(6, path += `m -2 -2 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4`);

						$$invalidate(5, arrowPath = `M${toTask.left - ARROW_SIZE}  ${toTask.top + toTask.height / 2 - ARROW_SIZE} 
                            L${toTask.left} ${toTask.top + toTask.height / 2} 
                            L${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 + ARROW_SIZE} Z`);
					} else if (isToRowHidden) {
						$$invalidate(6, path = `M${startX} ${startY}`);

						if (startX + MIN_LEN >= endX && startY != endY) {
							$$invalidate(6, path += `L ${startX + 1.5 + MIN_LEN} ${startY}`);
						} else {
							$$invalidate(6, path += `L ${startX + 1.5 + width / 2} ${startY}`);
						}

						$$invalidate(6, path += `m -2 -2 a 2 2 0 1 1 0 4 a 2 2 0 1 1 0 -4`);
						$$invalidate(5, arrowPath = ``);
					} else if (!isFromRowHidden && !isToRowHidden) {
						$$invalidate(6, path = `M${startX} ${startY}`);

						if (startX + MIN_LEN >= endX && startY != endY) {
							$$invalidate(6, path += `L ${startX + MIN_LEN} ${startY} 
                            L ${startX + MIN_LEN} ${startY + height / 2}
                            L ${endX - MIN_LEN} ${startY + height / 2}
                            L ${endX - MIN_LEN} ${endY}
                            L ${endX - 2} ${endY}`);
						} else {
							$$invalidate(6, path += `L ${startX + width / 2} ${startY} 
                            L ${startX + width / 2} ${endY}
                            L ${endX - 2} ${endY}`);
						}

						$$invalidate(5, arrowPath = `M${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 - ARROW_SIZE} 
                            L${toTask.left} ${toTask.top + toTask.height / 2} 
                            L${toTask.left - ARROW_SIZE} ${toTask.top + toTask.height / 2 + ARROW_SIZE} Z`);
					}
				}
			}
		};

		return [
			id,
			stroke,
			strokeWidth,
			isFromRowHidden,
			isToRowHidden,
			arrowPath,
			path,
			rowStore,
			taskStore,
			fromId,
			toId,
			fromTask,
			toTask,
			$rowStore,
			$taskStore
		];
	}

	class Dependency extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$1, create_fragment$1, safe_not_equal, {
				id: 0,
				fromId: 9,
				toId: 10,
				stroke: 1,
				strokeWidth: 2
			});
		}
	}

	var css_248z = ".dependency-container.svelte-epxabx{position:absolute;width:100%;height:100%;pointer-events:none;top:0;float:left;overflow:hidden;z-index:0}";
	styleInject(css_248z);

	/* src/modules/dependencies/GanttDependencies.svelte generated by Svelte v4.2.19 */

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[7] = list[i];
		return child_ctx;
	}

	// (27:4) {#each visibleDependencies as dependency (dependency.id)}
	function create_each_block(key_1, ctx) {
		let first;
		let dependency_1;
		let current;
		const dependency_1_spread_levels = [/*dependency*/ ctx[7]];
		let dependency_1_props = {};

		for (let i = 0; i < dependency_1_spread_levels.length; i += 1) {
			dependency_1_props = assign(dependency_1_props, dependency_1_spread_levels[i]);
		}

		dependency_1 = new Dependency({ props: dependency_1_props });

		return {
			key: key_1,
			first: null,
			c() {
				first = empty();
				create_component(dependency_1.$$.fragment);
				this.first = first;
			},
			m(target, anchor) {
				insert(target, first, anchor);
				mount_component(dependency_1, target, anchor);
				current = true;
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;

				const dependency_1_changes = (dirty & /*visibleDependencies*/ 1)
				? get_spread_update(dependency_1_spread_levels, [get_spread_object(/*dependency*/ ctx[7])])
				: {};

				dependency_1.$set(dependency_1_changes);
			},
			i(local) {
				if (current) return;
				transition_in(dependency_1.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(dependency_1.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(first);
				}

				destroy_component(dependency_1, detaching);
			}
		};
	}

	function create_fragment(ctx) {
		let div;
		let each_blocks = [];
		let each_1_lookup = new Map();
		let current;
		let each_value = ensure_array_like(/*visibleDependencies*/ ctx[0]);
		const get_key = ctx => /*dependency*/ ctx[7].id;

		for (let i = 0; i < each_value.length; i += 1) {
			let child_ctx = get_each_context(ctx, each_value, i);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
		}

		return {
			c() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(div, "class", "dependency-container svelte-epxabx");
			},
			m(target, anchor) {
				insert(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}

				current = true;
			},
			p(ctx, [dirty]) {
				if (dirty & /*visibleDependencies*/ 1) {
					each_value = ensure_array_like(/*visibleDependencies*/ ctx[0]);
					group_outros();
					each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
					check_outros();
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].d();
				}
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let $visibleHeight;
		let $taskStore;
		const { visibleHeight } = getContext('dimensions');
		component_subscribe($$self, visibleHeight, value => $$invalidate(5, $visibleHeight = value));
		const { taskStore } = getContext('dataStore');
		component_subscribe($$self, taskStore, value => $$invalidate(6, $taskStore = value));
		let { paddingTop } = $$props;
		let { dependencies = [] } = $$props;
		let visibleDependencies = [];

		$$self.$$set = $$props => {
			if ('paddingTop' in $$props) $$invalidate(3, paddingTop = $$props.paddingTop);
			if ('dependencies' in $$props) $$invalidate(4, dependencies = $$props.dependencies);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*dependencies, $taskStore, paddingTop, $visibleHeight*/ 120) {
				{
					const result = [];

					for (let i = 0; i < dependencies.length; i++) {
						const dependency = dependencies[i];
						const map = $taskStore.entities;
						const fromTask = map[dependency.fromId];
						const toTask = map[dependency.toId];

						if (fromTask && toTask && Math.min(fromTask.top, toTask.top) <= paddingTop + $visibleHeight && Math.max(fromTask.top, toTask.top) >= paddingTop) {
							result.push(dependency);
						}
					}

					$$invalidate(0, visibleDependencies = result);
				}
			}
		};

		return [
			visibleDependencies,
			visibleHeight,
			taskStore,
			paddingTop,
			dependencies,
			$visibleHeight,
			$taskStore
		];
	}

	class GanttDependencies extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance, create_fragment, safe_not_equal, { paddingTop: 3, dependencies: 4 });
		}
	}

	const SvelteGanttDependencies = GanttDependencies;

	const defaults = {
	    enabled: true,
	    elementContent: () => {
	        const element = document.createElement('div');
	        element.innerHTML = 'New Task';
	        Object.assign(element.style, {
	            position: 'absolute',
	            background: '#eee',
	            padding: '0.5em 1em',
	            fontSize: '12px',
	            pointerEvents: 'none'
	        });
	        return element;
	    }
	};
	class SvelteGanttExternal {
	    draggable;
	    element;
	    options;
	    constructor(node, options) {
	        this.options = Object.assign({}, defaults, options);
	        this.draggable = useDraggable(node, {
	            onDrag: this.onDrag.bind(this),
	            dragAllowed: () => this.options.enabled,
	            resizeAllowed: false,
	            onDrop: this.onDrop.bind(this),
	            container: document.body,
	            getX: (event) => event.pageX,
	            getY: (event) => event.pageY,
	            getWidth: () => 0
	        });
	    }
	    onDrag({ x, y }) {
	        if (!this.element) {
	            this.element = this.options.elementContent();
	            document.body.appendChild(this.element);
	            this.options.dragging = true;
	        }
	        this.element.style.top = y + 'px';
	        this.element.style.left = x + 'px';
	    }
	    onDrop(event) {
	        const gantt = this.options.gantt;
	        const rowId = getRowAtPoint(event.mouseEvent);
	        const targetRow = gantt.getRow(rowId);
	        if (targetRow && isDraggable(targetRow.model)) {
	            const mousePos = getRelativePos(gantt.getRowContainer(), event.mouseEvent);
	            const date = gantt.utils.getDateByPosition(mousePos.x);
	            this.options.onsuccess?.(targetRow, date, gantt);
	        }
	        else {
	            this.options.onfail?.();
	        }
	        document.body.removeChild(this.element);
	        this.options.dragging = false;
	        this.element = null;
	    }
	}

	/**
	 * Date adapter that uses MomentJS
	 */
	class MomentSvelteGanttDateAdapter {
	    moment;
	    constructor(moment) {
	        this.moment = moment;
	    }
	    format(date, format) {
	        return this.moment(date).format(format);
	    }
	    roundTo(date, unit, offset) {
	        const m = this.moment(date);
	        roundMoment(m, offset, unit);
	        return m.valueOf();
	    }
	}
	const aliases = {
	    hour: 'hours',
	    minute: 'minutes',
	    second: 'seconds',
	    millisecond: 'milliseconds'
	};
	// TODO: write tests for this
	function roundMoment(m, precision, key, direction = 'round') {
	    if (precision === 1 && key === 'day') {
	        precision = 24;
	        key = 'hours';
	    }
	    if (aliases[key]) {
	        key = aliases[key];
	    }
	    const methods = {
	        hours: 24,
	        minutes: 60,
	        seconds: 60,
	        milliseconds: 1000
	    };
	    if (!methods[key]) {
	        console.warn(`Rounding dates by ${key} is not supported`);
	    }
	    let value = 0;
	    let rounded = false;
	    let subRatio = 1;
	    let maxValue;
	    for (const k in methods) {
	        if (k === key) {
	            value = m.get(key);
	            maxValue = methods[k];
	            rounded = true;
	        }
	        else if (rounded) {
	            subRatio *= methods[k];
	            value += m.get(k) / subRatio;
	            m.set(k, 0);
	        }
	    }
	    value = Math[direction](value / precision) * precision; // value is date represented in units of `key`, ignoring the bigger units, eg 14h30m->14.5h
	    value = Math.min(value, maxValue);
	    m.set(key, value);
	    return m;
	}

	const SvelteGantt = Gantt;

	exports.MomentSvelteGanttDateAdapter = MomentSvelteGanttDateAdapter;
	exports.SvelteGantt = SvelteGantt;
	exports.SvelteGanttDependencies = SvelteGanttDependencies;
	exports.SvelteGanttExternal = SvelteGanttExternal;
	exports.SvelteGanttTable = SvelteGanttTable;

	Object.defineProperty(exports, '__esModule', { value: true });

})(this.window = this.window || {});
