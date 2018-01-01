import { Action, Update } from "affx";
import { debounce, delay, getJSON, http, retry } from "affx-affects";
import * as React from "react";
import { withAffx, WithAffxProps } from "react-affx";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

// State
export interface AppState {
  counter: number;
  error?: Error;
  users: User[];
}

export const appInitialState = (): AppState => ({ counter: 0, users: [] });

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

export type AppActions =
  | Action<"INCREMENT">
  | Action<"NOOP">
  | Action<"DECREMENT">
  | Action<"DELAYED_INCREMENT">
  | Action<"DELAYED_DECREMENT">
  | Action<"FETCH_USERS">
  | ErrorAction
  | UsersFetchedAction
  | ChangeInputAction;

// Action Creators
const everyActionCreators = {
  increment(): Action<"INCREMENT"> {
    return { type: "INCREMENT" };
  },
  decrement(): Action<"DECREMENT"> {
    return { type: "DECREMENT" };
  },
  fetchUsers(
    error: null | Error,
    data?: AppState["users"],
  ): ErrorAction | UsersFetchedAction | void {
    if (error) {
      return { error, type: "ERROR" };
    }

    if (data) {
      return { type: "USERS_FETCH", users: data };
    }
  },
};

// Command Creators
const everyCommandCreators = {
  debounce: debounce(Symbol("my-debounce"), 500),
  delay: delay(1000),
  fetchUsers: retry(
    Symbol("my-retry"),
    5,
    getJSON<AppState["users"]>(
      http(
        "https://jsonplaceholder.typicode.com/users",
        { timeout: 35 }, // Will break after 35 ms
      ),
    ),
  ),
};

// Update
// Our update function is totally pure, and therefore easier to test
interface UpdateInjections {
  actionCreators: typeof everyActionCreators;
  commandCreators: typeof everyCommandCreators;
}

const pureAppUpdate = ({
  actionCreators,
  commandCreators,
}: UpdateInjections): Update<AppState, AppActions> => action => state => {
  switch (action.type) {
    case "INCREMENT":
      return { state: { ...state, counter: state.counter + 1 } };

    case "DECREMENT":
      return { state: { ...state, counter: state.counter - 1 } };

    case "DELAYED_INCREMENT":
      return {
        commands: [commandCreators.delay(actionCreators.increment)],
        state,
      };

    case "DELAYED_DECREMENT":
      return {
        commands: [commandCreators.delay(actionCreators.decrement)],
        state,
      };

    case "FETCH_USERS": {
      return {
        commands: [commandCreators.fetchUsers(actionCreators.fetchUsers)],
        state: { ...state, counter: state.counter + 1 },
      };
    }

    case "USERS_FETCH":
      return { state: { ...state, users: action.users } };

    case "ERROR":
      return { state: { ...state, error: action.error } };

    case "CHANGE_INPUT": {
      return {
        commands: [commandCreators.debounce(actionCreators.increment)],
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

export const appUpdate = pureAppUpdate({
  actionCreators: everyActionCreators,
  commandCreators: everyCommandCreators,
});

// Component
export class PartialApp extends React.PureComponent<
  object & WithAffxProps<AppState, AppActions>
> {
  public render() {
    const { counter, dispatch, error, users } = this.props;

    return (
      <div className="App">
        {error && <div>Oh... {error.message}</div>}
        <button type="button" onClick={dispatch.always({ type: "NOOP" })}>
          NoOp
        </button>
        <button type="button" onClick={dispatch.always({ type: "INCREMENT" })}>
          +
        </button>
        <button type="button" onClick={dispatch.always({ type: "DECREMENT" })}>
          -
        </button>
        <button
          type="button"
          onClick={dispatch.always({ type: "DELAYED_DECREMENT" })}
        >
          --
        </button>
        <button
          type="button"
          onClick={dispatch.always({ type: "DELAYED_INCREMENT" })}
        >
          ++
        </button>
        <button
          type="button"
          onClick={dispatch.always({ type: "FETCH_USERS" })}
        >
          Fetch
        </button>
        <a
          href="https://google.com"
          onClick={dispatch.always(
            { type: "INCREMENT" },
            { preventDefault: true },
          )}
        >
          Google
        </a>
        <input
          type="text"
          onChange={({ currentTarget: { value } }) =>
            dispatch({ type: "CHANGE_INPUT", value })
          }
        />
        <div>{counter}</div>
        <div>{JSON.stringify(users, null, 2)}</div>
      </div>
    );
  }
}

export const App = withAffx(appInitialState(), appUpdate)(PartialApp);
