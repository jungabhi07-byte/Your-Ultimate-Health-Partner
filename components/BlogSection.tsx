import React from 'react';
import { Coffee, Moon, Activity, Droplet, Sun, Smile, Lightbulb } from 'lucide-react';

const blogs = [
  {
    title: "The Power of Hydration",
    description: "Drinking enough water is crucial for many bodily functions, including regulating body temperature, keeping joints lubricated, preventing infections, delivering nutrients to cells, and keeping organs functioning properly. Being well-hydrated also improves sleep quality, cognition, and mood.",
    icon: <Droplet className="h-6 w-6 text-blue-500" />,
    color: "bg-blue-50"
  },
  {
    title: "Sleep: The Foundation of Health",
    description: "Sleep services all aspects of our body in one way or another: molecular, energy balance, as well as intellectual function, alertness and mood. Aim for 7-9 hours of quality sleep to boost your immune system and mental clarity.",
    icon: <Moon className="h-6 w-6 text-indigo-500" />,
    color: "bg-indigo-50"
  },
  {
    title: "Movement as Medicine",
    description: "Regular physical activity is one of the most important things you can do for your health. Being physically active can improve your brain health, help manage weight, reduce the risk of disease, strengthen bones and muscles, and improve your ability to do everyday activities.",
    icon: <Activity className="h-6 w-6 text-teal-500" />,
    color: "bg-teal-50"
  },
  {
    title: "Mindful Eating Habits",
    description: "Mindful eating maintains an in-the-moment awareness of the food and drink you put into your body. It involves observing how the food makes you feel and the signals your body sends about taste, satisfaction, and fullness.",
    icon: <Coffee className="h-6 w-6 text-orange-500" />,
    color: "bg-orange-50"
  },
  {
    title: "Vitamin D & Sunlight",
    description: "Sun exposure is the most natural way to get enough vitamin D. To maintain healthy blood levels, aim to get 10–30 minutes of midday sunlight several times per week. Vitamin D is essential for healthy bones and a strong immune system.",
    icon: <Sun className="h-6 w-6 text-yellow-500" />,
    color: "bg-yellow-50"
  },
  {
    title: "Stress Management",
    description: "Chronic stress puts your health at risk. Effective stress management helps you break the hold stress has on your life, so you can be happier, healthier, and more productive. Techniques include deep breathing, meditation, and connecting with others.",
    icon: <Smile className="h-6 w-6 text-rose-500" />,
    color: "bg-rose-50"
  }
];

const BlogSection: React.FC = () => {
  return (
    <div id="learn-more" className="py-12 bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl flex items-center justify-center gap-3">
            Wellness Wisdom <Lightbulb className="h-8 w-8 text-yellow-500 fill-yellow-100" />
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Simple, science-backed tips to improve your daily life and long-term health.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {blogs.map((post) => (
            <article key={post.title} className="flex flex-col items-start justify-between bg-slate-50 rounded-2xl p-8 shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-lg ${post.color} mb-4`}>
                {post.icon}
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-teal-600 transition-colors">
                  <span className="absolute inset-0" />
                  {post.title}
                </h3>
                <p className="mt-5 text-sm leading-6 text-gray-600">
                  {post.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogSection;