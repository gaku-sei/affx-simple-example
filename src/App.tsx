import { Action, Update } from "affx";
import { ajax, debounce, delay } from "affx-affects";
import * as React from "react";
import { withAffx, WithAffxProps } from "react-affx";

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

const initialState: AppState = { counter: 0, users: [] };

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

// Action Creators
const allActionCreators = {
  increment(): Action<"INCREMENT"> {
    return { type: "INCREMENT" };
  },
  decrement(): Action<"DECREMENT"> {
    return { type: "DECREMENT" };
  },
  fetchUsers({
    data,
    error,
  }: {
    data?: AppState["users"];
    error?: Error;
  }): ErrorAction | UsersFetchedAction | void {
    if (error) {
      return { error, type: "ERROR" };
    }

    if (data) {
      return { type: "USERS_FETCH", users: data };
    }
  },
};

// Command Builders
const allCommandBuilders = {
  debounce: debounce(500, Symbol("my-debounce")),
  delay: delay(1000),
  fetchUsers: ajax<AppState["users"]>(
    "https://jsonplaceholder.typicode.com/users",
    "json",
    { timeout: 1000 }, // Will break after one second
  ),
};

// Update
// Our update function is totally pure, and therefore easier to test
interface UpdateInjections {
  actionCreators: typeof allActionCreators;
  commandBuilders: typeof allCommandBuilders;
}

const update = ({
  actionCreators,
  commandBuilders,
}: UpdateInjections): Update<AppState, AppActions> => action => state => {
  switch (action.type) {
    case "INCREMENT":
      return { state: { ...state, counter: state.counter + 1 } };

    case "DECREMENT":
      return { state: { ...state, counter: state.counter - 1 } };

    case "DELAYED_INCREMENT":
      return {
        commands: [commandBuilders.delay(actionCreators.increment)],
        state,
      };

    case "DELAYED_DECREMENT":
      return {
        commands: [commandBuilders.delay(actionCreators.decrement)],
        state,
      };

    case "FETCH_USERS": {
      return {
        commands: [commandBuilders.fetchUsers(actionCreators.fetchUsers)],
        state: { ...state, counter: state.counter + 1 },
      };
    }

    case "USERS_FETCH":
      return { state: { ...state, users: action.users } };

    case "ERROR":
      return { state: { ...state, error: action.error } };

    case "CHANGE_INPUT": {
      return {
        commands: [commandBuilders.debounce(actionCreators.increment)],
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
const PartialApp: React.StatelessComponent<
  object & WithAffxProps<AppState, AppActions>
> = ({ counter, dispatch, error, users }) => (
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
    <button type="button" onClick={dispatch.always({ type: "FETCH_USERS" })}>
      Fetch
    </button>
    <a
      href="https://google.com"
      onClick={dispatch.always({ type: "INCREMENT" }, { preventDefault: true })}
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

export const App = withAffx(
  initialState,
  update({
    actionCreators: allActionCreators,
    commandBuilders: allCommandBuilders,
  }),
)(PartialApp);
