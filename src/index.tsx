import * as React from "react";
import { render } from "react-dom";
import { mapReactDispatcher, WithAffxProps, withAffx } from "react-affx";
import { Update, Action, ActionCreator } from "affx";

import {
  PartialApp,
  AppState,
  appInitialState,
  AppActions,
  appUpdate,
} from "./App";
import { mapCommands } from "affx/lib/mappers";

interface MetaAppState {
  app1: AppState;
  app2: AppState;
}

const initialState = (): MetaAppState => ({
  app1: appInitialState(),
  app2: appInitialState(),
});

interface App1Action extends Action<"APP_1_ACTION"> {
  action: AppActions;
}
interface App2Action extends Action<"APP_2_ACTION"> {
  action: AppActions;
}

const app1ActionCreator: ActionCreator<AppActions, App1Action> = action => ({
  action,
  type: "APP_1_ACTION",
});

const app2ActionCreator: ActionCreator<AppActions, App2Action> = action => ({
  action,
  type: "APP_2_ACTION",
});

type MetaAppActions = App1Action | App2Action;

const metaAppUpdate: Update<MetaAppState, MetaAppActions> = action => state => {
  switch (action.type) {
    case "APP_1_ACTION": {
      const { commands, state: app1 } = appUpdate(action.action)(state.app1);
      const newState = { ...state, app1 };

      return !commands
        ? { state: newState }
        : {
            state: newState,
            commands: mapCommands(app1ActionCreator, commands),
          };
    }

    case "APP_2_ACTION": {
      const { commands, state: app2 } = appUpdate(action.action)(state.app2);
      const newState = { ...state, app2 };

      return !commands
        ? { state: newState }
        : {
            state: newState,
            commands: mapCommands(app2ActionCreator, commands),
          };
    }

    default:
      return { state };
  }
};

class PartialMetaApp extends React.PureComponent<
  object & WithAffxProps<MetaAppState, MetaAppActions>
> {
  private app1Dispatcher = mapReactDispatcher(
    app1ActionCreator,
    this.props.dispatch,
  );

  private app2Dispatcher = mapReactDispatcher(
    app2ActionCreator,
    this.props.dispatch,
  );

  public render() {
    const { app1, app2 } = this.props;

    return (
      <div style={{ display: "flex" }}>
        <div style={{ width: "50%" }}>
          <PartialApp {...app1} dispatch={this.app1Dispatcher} />
        </div>
        <div style={{ width: "50%" }}>
          <PartialApp {...app2} dispatch={this.app2Dispatcher} />
        </div>
      </div>
    );
  }
}

const MetaApp = withAffx(initialState(), metaAppUpdate)(PartialMetaApp);

render(<MetaApp />, document.getElementById("root"));
