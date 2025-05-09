export const ajax = {
	/**
	 * currently with if else, because the old ajax calles are still used
	 * 
	 * @param {*} dataOrUrl 
	 * @param {*} dataOrNoJSON 
	 * @returns 
	 */
	async post(dataOrUrl, dataOrNoJSON = false) {
		if (typeof dataOrUrl === 'string') {
			const url = dataOrUrl;
			const data = dataOrNoJSON;
			return this.requestLocation(url, data, "POST");
		} else if (typeof dataOrUrl === 'object') {
			const data = dataOrUrl;
			const noJSON = dataOrNoJSON;
			return this.request(data, "POST", noJSON);
		} else {
			throw new Error("Invalid parameter");
		}
	},

	async get(url, data = {}) {
		return this.requestLocation(url, data, "GET");
	},

	async put(url, data = {}) {
		return this.requestLocation(url, data, "PUT");
	},

	async delete(url, data = {}) {
		return this.requestLocation(url, data, "DELETE");
	},

	async request(data, type, noJSON = false) {
		data.getReason = data.r;
		const param = Object.keys(data).map(key => {
			return `${key}=${encodeURIComponent(data[key])}`;
		});
		let response = await makeAsyncCall(type, param.join("&"), "").then(result => {
			return result;
		}).catch(() => {
			return {};
		});

		if (noJSON) {
			return response;
		}

		let json = {};
		try {
			json = JSON.parse(response);
		} catch (e) {
			return {};
		}

		return json;
	},

	async requestLocation(url, data, type) {
		const param = Object.keys(data).map(key => {
			return `${key}=${encodeURIComponent(data[key])}`;
		});
		let response = await makeAsyncCall(type, param.join("&"), url).then(result => {
			return result;
		}).catch(() => {
			return {};
		});

		let json = {};
		try {
			json = JSON.parse(response);
		} catch (e) {
			return {};
		}

		return json;
	},

	async uploadFiles(files, location, additionalInfo = null) {
		if (files == null || files.length == 0) {
			return null;
		}

		const response = await uploadFilesHelper(files, location, additionalInfo).then(result => {
			return result;
		}).catch(() => {
			return {};
		});

		let json = {};
		try {
			json = JSON.parse(response);
		} catch (e) {
			return {};
		}

		return json;
	}
}

/**
 * 
 * @param {*} files
 * @param {*} location
 * @param {*} additionalInfo
 */
async function uploadFilesHelper(files, location, additionalInfo = null) {
	let formData = new FormData();
	Array.from(files).forEach(file => {
		/* https://stackoverflow.com/questions/65197158/what-does-formdata-appendfiles-file-mean-in-api-request */
		formData.append("files[]", file);
	});

	for (let key in additionalInfo) {
		formData.set(key, additionalInfo[key]);
	}

	return new Promise((resolve, reject) => {
		const ajaxCall = new XMLHttpRequest();
		ajaxCall.onload = function () {
			if (this.readyState == 4 && this.status == 200) {
				resolve(this.responseText);
			} else {
				reject(new Error(this.responseText));
			}
		}

		ajaxCall.onerror = function () {
			reject(new Error("Network error"));
		};

		ajaxCall.onerror = reject;
		ajaxCall.open("POST", location);
		ajaxCall.send(formData);
	});
}

export async function makeAsyncCall(type, params, location) {
	return new Promise((resolve, reject) => {
		const ajaxCall = new XMLHttpRequest();
		ajaxCall.onload = function () {
			if (this.readyState == 4 && this.status == 200) {
				resolve(this.responseText);
			} else {
				reject(new Error(this.responseText));
			}
		}

		ajaxCall.onerror = function () {
			reject(new Error("Network error"));
		};

		switch (type) {
			case "POST":
			case "PUT":
			case "DELETE":
				ajaxCall.open(type, location, true);
				ajaxCall.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				ajaxCall.send(params);
				break;
			case "GET":
				if (params == "") {
					ajaxCall.open("GET", `${location}`, true);
				} else {
					ajaxCall.open("GET", `${location}?${params}`, true);
				}
				ajaxCall.send();
				break;
			default:
				reject(new Error("Ajax Type not defined"));
				break;
		}
	});
}
