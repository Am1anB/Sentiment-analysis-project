from langchain_core.prompts import ChatPromptTemplate
from collections import Counter
import json

class Summarizer():
    def __init__(self, llm):
        self.llm = llm
        self.docs = None

    def create_prompt_template(self):
        system_message = """
        # IDENTITY AND ROLE
        You are a **Senior Customer Experience (CX) Data Analyst**. Your role is to synthesize unstructured survey feedback into a professional, actionable "Executive Summary" for the management team. 

        # GOAL
        Perform **Abstractive Summarization**. You must read the provided sentiment statistics and topic groupings, then rewrite the findings into a cohesive narrative.
        **DO NOT** simply copy-paste the user's comments. You must interpret them and write a professional summary in your own words.

        # OUTPUT REQUIREMENTS
        1. Language: **Formal Thai (ภาษาไทยทางการ)** suitable for a business dashboard.
        2. Format: Use Markdown structure.
        3. Tone: Objective, Insightful, Professional, and Concise.

        # RESPONSE STRUCTURE (Markdown)
        
        ## 1. Executive Overview (บทสรุปผู้บริหาร)
        - Write one concise paragraph summarizing the overall situation.
        - Incorporate the sentiment statistics provided to describe the general mood.

        ## 2. Key Insights by Topic (เจาะลึกประเด็นสำคัญ)
        Iterate through the topics provided in the JSON data. For each significant topic:
        - **Topic Name:** A clear, human-readable Thai title.
        - **Summary:** A synthesized explanation of what users are saying.
        - **Sentiment:** Mention the dominant sentiment for this topic.

        ## 3. Strategic Recommendations (ข้อเสนอแนะเพื่อการปรับปรุง)
        - Provide 3 actionable steps based on the insights.
        """

        user_message = """
        Here is the analysis data:

        [PART 1: SENTIMENT STATISTICS]
        {stats_str}

        [PART 2: DATA GROUPED BY TOPIC]
        (The data is in JSON format: Topic Name -> List of Comments)
        {topics_json_str}

        Please generate the Executive Report in Thai based on this data.
        """

        prompt = ChatPromptTemplate([
            ('system', system_message),
            ('human', user_message)
        ])

        return prompt

    def handle_docs(self, sentiment_output, topic_output):
        combined_results = []

        for sent_item, topic_name in zip(sentiment_output, topic_output):
            t_name = topic_name[0] if isinstance(topic_name, list) else topic_name
            combined_results.append({
                "text": sent_item['text'],
                "sentiment": sent_item['sentiment'],
                "topic": t_name
            })
        return combined_results

    def calculate_stats(self, combined_data):
        total = len(combined_data)
        if total == 0: return "No data"
        
        sentiments = [item['sentiment'] for item in combined_data]
        counts = Counter(sentiments)
        
        stat_str = f"Total Responses: {total}\n"
        for sent, count in counts.items():
            percent = (count / total) * 100
            stat_str += f"- {sent}: {count} ({percent:.1f}%)\n"
        
        return stat_str

    def summarization(self, sentiment_output, topic_output):
        combined_results = self.handle_docs(sentiment_output, topic_output)

        stats_str = self.calculate_stats(combined_results)
        print(stats_str)

        aggregation = {}

        for item in combined_results:
            t_name = item['topic']
            sentiment_key = item['sentiment'].lower()

            if t_name not in aggregation:
                aggregation[t_name] = {
                    "texts": [],
                    "positive": {"count": 0, "docs": []},
                    "negative": {"count": 0, "docs": []},
                    "neutral":  {"count": 0, "docs": []}
                }

            aggregation[t_name]["texts"].append(f"[{item['sentiment']}] {item['text']}")

            if sentiment_key in aggregation[t_name]:
                aggregation[t_name][sentiment_key]['count'] += 1
                aggregation[t_name][sentiment_key]['docs'].append(item['text'])

        topics_summary_for_llm = {k: v['texts'] for k, v in aggregation.items()}
        topics_json_str = json.dumps(topics_summary_for_llm, ensure_ascii=False, indent=2)

        topics_stat = []
        for t_name, data in aggregation.items():
            topic_obj = {
                t_name: {
                    "positive": data["positive"],
                    "negative": data["negative"],
                    "neutral": data["neutral"]
                }
            }
            topics_stat.append(topic_obj)

        prompt = self.create_prompt_template()
        chain = prompt | self.llm

        response = chain.invoke({
            "stats_str": stats_str,
            "topics_json_str": topics_json_str
        })
        print(topics_stat)
        return response.content, topics_stat