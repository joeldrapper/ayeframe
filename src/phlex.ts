import { morph } from "morphlex";

type ActionMap = Map<string, (event: Event) => void>;

interface Event {
	readonly targetNode: Element | null;
	readonly newNode: Element | null;
}

const Actions: ActionMap = new Map();

export function init(): void {
	// document.addEventListener("submit", (event) => {
	// 	if (event.target instanceof HTMLFormElement) {
	// 		console.log("submitted a form");
	// 	}
	// });

	document.addEventListener("click", (event) => {
		const link = event.target;

		if (link instanceof HTMLAnchorElement) {
			if (event.metaKey || event.ctrlKey || event.shiftKey) return;

			if (link.ariaDisabled) {
				event.preventDefault();
				return;
			}

			const href = link.href;
			const action = link.getAttribute("phlex-action");
			const targetId = link.getAttribute("phlex-target");
			const fragment = link.getAttribute("phlex-fragment");

			if (action) {
				event.preventDefault();
				link.ariaDisabled = "true";

				createEvent(href, targetId, fragment).then((event) => {
					const actionMethod = Actions.get(action);
					if (actionMethod) actionMethod(event);

					link.ariaDisabled = null;
				});
			}
		}
	});
}

async function createEvent(href: string, targetId: string | null, fragment: string | null): Promise<Event> {
	const headers = new Headers();
	if (fragment) headers.append("X-Fragment", fragment);

	const event = await fetch(href, { headers }).then(async (response): Promise<Event> => {
		return await response.text().then((text): Event => {
			const template = document.createElement("template");
			template.innerHTML = text;
			const node = template.content.firstElementChild;
			const target = targetId ? document.getElementById(targetId) : null;

			return { targetNode: target, newNode: node };
		});
	});

	return event;
}

export function defineAction(name: string, action: (event: Event) => void): void {
	Actions.set(name, action);
}

defineAction("morph", ({ targetNode: target, newNode: node }) => {
	if (target && node) morph(target, node);
});

defineAction("replace", ({ targetNode: target, newNode: node }) => {
	if (node) target?.replaceWith(node);
});

defineAction("append", ({ targetNode: target, newNode: node }) => {
	if (node) target?.appendChild(node);
});

defineAction("prepend", ({ targetNode: target, newNode: node }) => {
	if (node) target?.prepend(node);
});

defineAction("refresh", () => {
	fetch(document.location.href).then((response) => {
		if (response.ok) {
			response.text().then((text) => {
				morph(document.documentElement, text);
			});
		}
	});
});

defineAction("remove", ({ targetNode: target }) => {
	target?.remove();
});

defineAction("navigate", ({ newNode: node }) => {
	if (node) morph(document.documentElement, node);
});
