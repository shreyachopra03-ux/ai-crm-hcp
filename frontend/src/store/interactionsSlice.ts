import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { interactionsApi, Interaction, InteractionCreate } from "../api/client";

// Mirrors backend FormData schema
export interface ChatFormData {
  hcp_name?: string | null;
  interaction_type?: string | null;
  date?: string | null;
  time?: string | null;
  attendees?: string | null;
  topics_discussed?: string | null;
  materials_shared?: string | null;
  samples_distributed?: string | null;
  sentiment?: string | null;
  outcomes?: string | null;
  follow_up_actions?: string | null;
}

interface InteractionsState {
  items: Interaction[];
  selected: Interaction | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sentimentFilter: string;
  // Auto-fill data extracted from AI chat
  chatFormData: ChatFormData | null;
}

const initialState: InteractionsState = {
  items: [],
  selected: null,
  loading: false,
  error: null,
  searchQuery: "",
  sentimentFilter: "",
  chatFormData: null,
};

export const fetchInteractions = createAsyncThunk(
  "interactions/fetchAll",
  async (params?: { search?: string; sentiment?: string }) => {
    const res = await interactionsApi.list(params);
    return res.data;
  }
);

export const createInteraction = createAsyncThunk(
  "interactions/create",
  async (data: InteractionCreate) => {
    const res = await interactionsApi.create(data);
    return res.data;
  }
);

export const deleteInteraction = createAsyncThunk(
  "interactions/delete",
  async (id: number) => {
    await interactionsApi.delete(id);
    return id;
  }
);

export const fetchHcpInteractions = createAsyncThunk(
  "interactions/fetchByHcp",
  async (name: string) => {
    const res = await interactionsApi.getByHcp(name);
    return res.data;
  }
);

const interactionsSlice = createSlice({
  name: "interactions",
  initialState,
  reducers: {
    setSelected(state, action: PayloadAction<Interaction | null>) {
      state.selected = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSentimentFilter(state, action: PayloadAction<string>) {
      state.sentimentFilter = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    // Auto-fill form from AI chat extraction
    setChatFormData(state, action: PayloadAction<ChatFormData>) {
      state.chatFormData = action.payload;
    },
    clearChatFormData(state) {
      state.chatFormData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch interactions";
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createInteraction.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create interaction";
      })
      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(fetchHcpInteractions.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      });
  },
});

export const { setSelected, setSearchQuery, setSentimentFilter, clearError, setChatFormData, clearChatFormData } =
  interactionsSlice.actions;
export default interactionsSlice.reducer;
