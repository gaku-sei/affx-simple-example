import { Action, buildDispatcher, Reduceable, Reducer } from "affx";
import { ajax, debounce, delay } from "affx/lib/affects";
import * as React from "react";
import "./App.css";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

// State
interface AppState {
  counter: number;
  error?: Error;
  users: User[];
}

// Actions
interface UsersFetchedAction extends Action<"USERS_FETCH"> {
  users: User[];
}

interface ChangeInputAction extends Action<"CHANGE_INPUT"> {
  value: string;
}

interface ErrorAction extends Action<"ERROR"> {
  error: Error;
}

type AppActions =
  | Action<"INCREMENT">
  | Action<"NOOP">
  | Action<"DECREMENT">
  | Action<"DELAYED_INCREMENT">
  | Action<"DELAYED_DECREMENT">
  | Action<"FETCH_USERS">
  | ErrorAction
  | UsersFetchedAction
  | ChangeInputAction;

// Command Builders
const commandBuilders = {
  addDebounce: debounce(500, Symbol("my-debounce")),
  addDelay: delay(1000),
  fetchUsers: ajax<AppState["users"]>(
    "https://jsonplaceholder.typicode.com/users",
    "json",
  ),
};

// Reducer
const reducer = (
  commands: typeof commandBuilders,
): Reducer<AppState, AppActions> => action => state => {
  switch (action.type) {
    case "INCREMENT":
      return { state: { ...state, counter: state.counter + 1 } };

    case "DECREMENT":
      return { state: { ...state, counter: state.counter - 1 } };

    case "DELAYED_INCREMENT":
      return {
        commands: [
          commands.addDelay((): Action<"INCREMENT"> => ({ type: "INCREMENT" })),
        ],
        state,
      };

    case "DELAYED_DECREMENT":
      return {
        commands: [
          commands.addDelay((): Action<"DECREMENT"> => ({ type: "DECREMENT" })),
        ],
        state,
      };

    case "FETCH_USERS": {
      return {
        commands: [
          commands.fetchUsers(({ data, error }):
            | ErrorAction
            | UsersFetchedAction
            | void => {
            if (error) {
              return { error, type: "ERROR" };
            }

            if (data) {
              return { type: "USERS_FETCH", users: data };
            }
          }),
        ],
        state: { ...state, counter: state.counter + 1 },
      };
    }

    case "USERS_FETCH":
      return { state: { ...state, users: action.users } };

    case "ERROR":
      return { state: { ...state, error: action.error } };

    case "CHANGE_INPUT": {
      return {
        commands: [
          commands.addDebounce((): Action<"INCREMENT"> => ({
            type: "INCREMENT",
          })),
        ],
        state,
      };
    }

    case "NOOP": {
      return { state };
    }

    default: {
      return { state };
    }
  }
};

// Component
export default class App extends React.Component<{}, AppState>
  implements Reduceable<AppActions> {
  public state: AppState = { counter: 0, users: [] };

  public dispatch = buildDispatcher(
    () => this.state,
    this.setState.bind(this),
    reducer(commandBuilders),
  );

  public render() {
    return (
      <div className="App">
        {this.state.error && <div>Oh... {this.state.error.message}</div>}
        <button type="button" onClick={this.dispatch.always({ type: "NOOP" })}>
          NoOp
        </button>
        <button
          type="button"
          onClick={this.dispatch.always({ type: "INCREMENT" })}
        >
          +
        </button>
        <button
          type="button"
          onClick={this.dispatch.always({ type: "DECREMENT" })}
        >
          -
        </button>
        <button
          type="button"
          onClick={this.dispatch.always({ type: "DELAYED_DECREMENT" })}
        >
          --
        </button>
        <button
          type="button"
          onClick={this.dispatch.always({ type: "DELAYED_INCREMENT" })}
        >
          ++
        </button>
        <button
          type="button"
          onClick={this.dispatch.always({ type: "FETCH_USERS" })}
        >
          Fetch
        </button>
        <a
          href="https://google.com"
          onClick={this.dispatch.always(
            { type: "INCREMENT" },
            { preventDefault: true },
          )}
        >
          Google
        </a>
        <input
          type="text"
          onChange={({ currentTarget: { value } }) =>
            this.dispatch({ type: "CHANGE_INPUT", value })
          }
        />
        <div>{JSON.stringify(this.state, null, 2)}</div>
      </div>
    );
  }
}
