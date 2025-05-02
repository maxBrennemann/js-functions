export const createPopup = (content) => {
	const container = document.createElement("div");
	container.classList.add("overlay-container");
	const contentContainer = document.createElement("div");
	contentContainer.classList.add("overlay-container__content");
	const optionsContainer = document.createElement("div");
	optionsContainer.classList.add("overlay-container__content__options");
	const button = document.createElement("button");
	button.classList.add("btn-cancel", "ml-2");
	button.innerHTML = "Abbrechen";
	button.addEventListener("click", () => {
		container.parentNode.removeChild(container);
		const event = new CustomEvent("closePopup", {
			bubbles: true,
		});
		optionsContainer.dispatchEvent(event);
	});
	optionsContainer.appendChild(button);

	content.classList.add("p-3");
	contentContainer.appendChild(content);
	contentContainer.appendChild(optionsContainer);
	container.appendChild(contentContainer);
	document.body.appendChild(container);

	return optionsContainer;
}
