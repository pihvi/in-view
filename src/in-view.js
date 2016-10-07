import Registry from './registry';
import { inViewport } from './viewport';
import { throttle } from 'lodash';

/**
* Create and return the inView function.
*/
const inView = () => {

    /**
    * Fallback if window is undefined.
    */
    if (typeof window === 'undefined') return;

    /**
    * How often and on what events we should check
    * each registry.
    */
    const interval = 100;
    const triggers = ['scroll', 'resize', 'load'];

    /**
    * Maintain a list of all registries and a default options object.
    */
    const register = [];
    const options  = { offset: {}, threshold: 0, test: inViewport };

    /**
    * Check each registry from selector history,
    * throttled to interval.
    */
    const check = throttle(() => {
        register.forEach(registry => {
            registry.check();
        });
    }, interval);

    /**
    * For each trigger event on window, add a listener
    * which checks each registry.
    */
    triggers.forEach(event =>
        addEventListener(event, check));

    /**
    * If supported, use MutationObserver to watch the
    * DOM and run checks on mutation.
    */
    if (window.MutationObserver) {
        new MutationObserver(check)
            .observe(document.body, { attributes: true, childList: true, subtree: true });
    }

    /**
    * The main interface. Take a selector string, or list
    * of nodes and return a new registry.
    */
    const control = (selection) => {
        const registry = Registry(getElements(selection), options);
        register.push(registry);
        return registry;
    };

    /**
    * Mutate the offset object with either an object
    * or a number.
    */
    control.offset = o => {
        if (o === undefined) return options.offset;
        const isNum = n => typeof n === 'number';
        ['top', 'right', 'bottom', 'left']
            .forEach(isNum(o) ?
                dim => options.offset[dim] = o :
                dim => isNum(o[dim]) ? options.offset[dim] = o[dim] : null
            );
        return options.offset;
    };

    /**
    * Set the threshold with a number.
    */
    control.threshold = n => {
        return typeof n === 'number' && n >= 0 && n <= 1
            ? options.threshold = n
            : options.threshold;
    };

    /**
    * Use a custom test, overriding inViewport, to
    * determine element visibility.
    */
    control.test = fn => {
        return typeof fn === 'function'
            ? options.test = fn
            : options.test;
    };

    /**
    * Add proxy for test function, set defaults,
    * and return the interface.
    */
    control.is = el => options.test(el, options);
    control.offset(0);
    return control;

};

function getElements(obj) {
    if (typeof obj === 'string')
        return [].slice.call(document.querySelectorAll(obj));
    if ([NodeList, HTMLCollection].some(collection => obj instanceof collection))
        return [].slice.call(obj);
    if (obj.nodeType)
        return [obj];
    throw new TypeError('Expected a selector string or list of nodes.');
}

// Export a singleton.
export default inView();
