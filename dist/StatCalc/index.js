//#region gadgets/utils/math-eval/math-eval.ts
/**
* Source: https://stackoverflow.com/a/75355272/8421861
* License: CC BY-SA 4.0
*/
var minus0Hack = (value) => Object.is(value, -0) ? "-0" : value;
var operators = {
	"+": {
		func: (x, y) => `${minus0Hack(Number(x) + Number(y))}`,
		precedence: 1,
		associativity: "left",
		arity: 2
	},
	"-": {
		func: (x, y) => `${minus0Hack(Number(x) - Number(y))}`,
		precedence: 1,
		associativity: "left",
		arity: 2
	},
	"*": {
		func: (x, y) => `${minus0Hack(Number(x) * Number(y))}`,
		precedence: 2,
		associativity: "left",
		arity: 2
	},
	"/": {
		func: (x, y) => `${minus0Hack(Number(x) / Number(y))}`,
		precedence: 2,
		associativity: "left",
		arity: 2
	},
	"%": {
		func: (x, y) => `${minus0Hack(Number(x) % Number(y))}`,
		precedence: 2,
		associativity: "left",
		arity: 2
	},
	"^": {
		func: (x, y) => `${minus0Hack(Math.pow(Number(x), Number(y)))}`,
		precedence: 3,
		associativity: "right",
		arity: 2
	}
};
var operatorsKeys = Object.keys(operators);
var functions = {
	min: {
		func: (x, y) => `${minus0Hack(Math.min(Number(x), Number(y)))}`,
		arity: 2
	},
	max: {
		func: (x, y) => `${minus0Hack(Math.max(Number(x), Number(y)))}`,
		arity: 2
	},
	sin: {
		func: (x) => `${minus0Hack(Math.sin(Number(x)))}`,
		arity: 1
	},
	cos: {
		func: (x) => `${minus0Hack(Math.cos(Number(x)))}`,
		arity: 1
	},
	tan: {
		func: (x) => `${minus0Hack(Math.tan(Number(x)))}`,
		arity: 1
	},
	log: {
		func: (x) => `${Math.log(Number(x))}`,
		arity: 1
	}
};
var functionsKeys = Object.keys(functions);
var top = (stack) => stack[stack.length - 1];
/**
* Shunting yard algorithm: converts infix expression to postfix expression (reverse Polish notation)
*
* Example: ['1', '+', '2'] => ['1', '2', '+']
*
* https://en.wikipedia.org/wiki/Shunting_yard_algorithm
* https://github.com/poteat/shunting-yard-typescript
* https://blog.kallisti.net.nz/2008/02/extension-to-the-shunting-yard-algorithm-to-allow-variable-numbers-of-arguments-to-functions/
*/
function shuntingYard(tokens) {
	const output = new Array();
	const operatorStack = new Array();
	for (const token of tokens) if (functions[token] !== void 0) operatorStack.push(token);
	else if (token === ",") {
		while (operatorStack.length > 0 && top(operatorStack) !== "(") output.push(operatorStack.pop());
		if (operatorStack.length === 0) throw new Error("Misplaced ','");
	} else if (operators[token] !== void 0) {
		const o1 = token;
		while (operatorStack.length > 0 && top(operatorStack) !== void 0 && top(operatorStack) !== "(" && (operators[top(operatorStack)].precedence > operators[o1].precedence || operators[o1].precedence === operators[top(operatorStack)].precedence && operators[o1].associativity === "left")) output.push(operatorStack.pop());
		operatorStack.push(o1);
	} else if (token === "(") operatorStack.push(token);
	else if (token === ")") {
		while (operatorStack.length > 0 && top(operatorStack) !== "(") output.push(operatorStack.pop());
		if (operatorStack.length > 0 && top(operatorStack) === "(") operatorStack.pop();
		else throw new Error("Parentheses mismatch");
		if (functions[top(operatorStack)] !== void 0) output.push(operatorStack.pop());
	} else output.push(token);
	while (operatorStack.length > 0) if (top(operatorStack) === "(") throw new Error("Parentheses mismatch");
	else output.push(operatorStack.pop());
	return output;
}
/**
* Evaluates reverse Polish notation (RPN) (postfix expression).
*
* Example: ['1', '2', '+'] => 3
*
* https://en.wikipedia.org/wiki/Reverse_Polish_notation
* https://github.com/poteat/shunting-yard-typescript
*/
function evalReversePolishNotation(tokens) {
	const stack = new Array();
	const ops = {
		...operators,
		...functions
	};
	for (const token of tokens) {
		const op = ops[token];
		if (op !== void 0) {
			const parameters = [];
			for (let i = 0; i < op.arity; i++) parameters.push(stack.pop());
			stack.push(op.func(...parameters.reverse()));
		} else stack.push(token);
	}
	if (stack.length > 1) throw new Error("Insufficient operators");
	return Number(stack[0]);
}
/**
* Breaks a mathematical expression into tokens.
*
* Example: "1 + 2" => [1, '+', 2]
*
* https://gist.github.com/tchayen/44c28e8d4230b3b05e9f
*/
function tokenize(expression) {
	const expr = expression.replace(/\s+/g, " ");
	const tokens = [];
	let acc = "";
	let currentNumber = "";
	for (let i = 0; i < expr.length; i++) {
		const c = expr.charAt(i);
		const prev_c = expr.charAt(i - 1);
		const next_c = expr.charAt(i + 1);
		const lastToken = top(tokens);
		const numberParsingStarted = currentNumber !== "";
		if (/\d/.test(c) || (c === "+" || c === "-") && !numberParsingStarted && (lastToken === void 0 || lastToken === "," || lastToken === "(" || operatorsKeys.includes(lastToken)) && /\d/.test(next_c)) currentNumber += c;
		else if (c === ".") if (numberParsingStarted && currentNumber.includes(".")) throw new Error(`Double '.' in number: '${currentNumber}${c}'`);
		else currentNumber += c;
		else if (c === " ") {
			if (/\d/.test(prev_c) && /\d/.test(next_c)) throw new Error(`Space in number: '${currentNumber}${c}${next_c}'`);
		} else if (functionsKeys.includes(acc + c)) {
			acc += c;
			if (!functionsKeys.includes(acc + next_c)) {
				tokens.push(acc);
				acc = "";
			}
		} else if (operatorsKeys.includes(c) || c === "(" || c === ")" || c === ",") {
			if (operatorsKeys.includes(c) && !numberParsingStarted && operatorsKeys.includes(lastToken)) throw new Error(`Consecutive operators: '${lastToken}${c}'`);
			if (numberParsingStarted) tokens.push(currentNumber);
			tokens.push(c);
			currentNumber = "";
		} else acc += c;
	}
	if (acc !== "") throw new Error(`Invalid characters: '${acc}'`);
	if (currentNumber !== "") tokens.push(currentNumber);
	if (tokens[0] === "+" || tokens[0] === "-") tokens.unshift("0");
	return tokens;
}
function calculate(expression) {
	return evalReversePolishNotation(shuntingYard(tokenize(expression)));
}
//#endregion
//#region gadgets/StatCalc/index.ts
(function() {
	const DEBUG_MODE = [
		"localhost:",
		"safemode=",
		"action=submit"
	].some((str) => window.location.href.includes(str));
	const DEFAULT_CONTROLLER_NAME = "main";
	function debounce(func, delay) {
		let timeoutId;
		return function(...args) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func.apply(this, args), delay);
		};
	}
	function showElementIndex(el, indices) {
		const data = /* @__PURE__ */ new Map();
		indices.forEach((index, key) => {
			for (const i of [
				"",
				"1",
				"2",
				"3",
				"4",
				"5"
			]) {
				const attr = `data-${key}${i}-values`;
				const rawValues = el.getAttribute(attr);
				if (rawValues) {
					const val = rawValues.split(",")[index] || "";
					data.set(key + i, val);
				}
			}
		});
		if (DEBUG_MODE) console.log("Parsed data: ", data);
		if (data.size == 1) {
			el.textContent = data.values().next().value;
			return;
		} else if (data.size > 1) {
			let formula = el.getAttribute("data-formula");
			if (!formula) return;
			const entries = Array.from(data.entries());
			const reversedEntries = entries.slice().sort(([k1], [k2]) => k2.length - k1.length);
			for (const [k, v] of reversedEntries) formula = formula?.replaceAll(k, v);
			if (DEBUG_MODE) {
				console.log("Entries", entries);
				console.log("New formula", formula);
			}
			const precision = parseInt(el.getAttribute("data-precision") || "0") || 0;
			el.textContent = calculate(formula).toFixed(precision).toString();
			el.title = entries.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n" + formula;
			return;
		}
		for (const [key, index] of indices.entries()) {
			const attr = `data-${key}-children`;
			const childIndices = el.getAttribute(attr);
			if (!childIndices) continue;
			const values = childIndices.split(",");
			let target = parseInt(values[index]) || 0;
			target -= 1;
			Array.from(el.children).forEach((child, index) => {
				if (index === target) child.style.display = "";
				else child.style.display = "none";
			});
			return;
		}
	}
	const initStatDisplay = (container) => {
		const selectedIndices = /* @__PURE__ */ new Map();
		const controllers = container.querySelectorAll(".stat-controls");
		if (controllers.length === 0) return;
		if (DEBUG_MODE) console.log("Controllers found: ", controllers);
		for (const controller of controllers) {
			const levels = controller.getAttribute("data-levels")?.split(",")?.map((val) => (val || "").trim())?.filter((val) => val && val !== "");
			if (!levels) return;
			const slider = document.createElement("input");
			slider.type = "range";
			slider.classList.add("stat-slider");
			slider.min = "0";
			slider.max = (levels.length - 1).toString();
			slider.value = "0";
			controller.appendChild(slider);
			const input = document.createElement("input");
			input.type = "text";
			input.classList.add("stat-input");
			controller.appendChild(input);
			const key = controller.getAttribute("data-name") || DEFAULT_CONTROLLER_NAME;
			const updateInputs = (index) => {
				index = Math.max(0, Math.min(index, levels.length - 1));
				selectedIndices.set(key, index);
				if (slider) slider.value = index.toString();
				if (input) input.value = levels[index].toString();
			};
			const indexUpdated = (index, doDebounce = false) => {
				updateInputs(index);
				if (doDebounce) debounce(updateUI, 5)();
				else updateUI();
			};
			slider.addEventListener("input", (e) => {
				const target = e.currentTarget;
				indexUpdated(parseInt(target.value), false);
			});
			input.addEventListener("change", (e) => {
				const val = e.currentTarget.value.trim();
				const index = levels.indexOf(val);
				if (index !== -1) indexUpdated(index);
				else indexUpdated(parseInt(slider.value));
			});
			updateInputs(0);
		}
		const updates = container.querySelectorAll(".stat-value");
		function updateUI() {
			updates.forEach((el) => showElementIndex(el, selectedIndices));
		}
		updateUI();
	};
	document.querySelectorAll(".stat-display").forEach(initStatDisplay);
})();
//#endregion
