# Vocab Importer

## Difficulty

---

## Business Goal

The prototype of the language learning app is built, but we need to quickly populate the application with word and word groups so students can begin testing the system.

There is currently no interface for manually adding words or word groups, and the process would be too tedious.

### You have been asked to:

- Create an internal-facing tool to generate vocabulary.
- Be able to export the generated vocabulary to JSON for later import.
- Be able to import JSON files.

---

## Technical Restrictions

Since this is an internal-facing tool, the fractional CTO wants you to use an application prototyping framework of your choice:

- Gradio
- Streamlit
- FastHTML

You need to use an LLM in order to generate the target words and word groups.

You can use either:

- Managed/Serverless LLM API
- Local LLM serving the model via OPEA

---