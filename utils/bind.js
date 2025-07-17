export default function(...args) {
	this.registered = true;
	this.register = () => {
		for (let arg of args) {
			arg.register();
		}
		this.registered = true;
		return this;
	}	
	this.unregister = () => {
		for (let arg of args) {
			arg.unregister();
		}
		this.registered = false;
		return this;
	}
	return this;
}
