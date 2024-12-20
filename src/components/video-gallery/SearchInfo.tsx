"use client";

import { motion } from "framer-motion";
import { FiSearch, FiVideo, FiGlobe, FiBookOpen } from "react-icons/fi";

export default function SearchInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mb-16 max-w-5xl"
    >
      <div className="text-center">
        <h2 className="mb-3 bg-gradient-to-r from-slate-200 to-slate-900 bg-clip-text text-3xl font-bold text-transparent">
          Intelligent Search
        </h2>
        <p className="mb-12 text-slate-600 dark:text-slate-400">
          Discover the archive through our advanced bilingual search system
        </p>
      </div>

      {/* Main Feature - Bilingual Search */}
      <div className="mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-full bg-amber-500/20 p-3 dark:bg-amber-500/10">
            <FiGlobe className="h-8 w-8 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-200">
              Bilingual Search
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Search seamlessly in English and Nepali
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl bg-slate-900/5 p-6 dark:bg-slate-900/50">
            <h4 className="font-medium text-blue-500 dark:text-blue-400">
              Example Queries
            </h4>
            <ul className="space-y-3 text-slate-500">
              <li className="flex items-center gap-2 dark:text-slate-300">
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                  EN
                </span>
                &quot;temples in Kathmandu&quot;
              </li>
              <li className="flex items-center gap-2 dark:text-slate-300">
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                  NE
                </span>
                &quot;नेवारी परम्परा&quot;
              </li>
              <li className="flex items-center gap-2 dark:text-slate-300">
                <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                  MIX
                </span>
                &quot;traditional पूजा ceremonies in Bhaktapur&quot;
              </li>
            </ul>
          </div>

          <div className="space-y-4 rounded-xl bg-slate-900/5 p-6 dark:bg-slate-900/50">
            <h4 className="font-medium text-green-500">
              Natural Language Queries
            </h4>
            <ul className="space-y-3 text-slate-500">
              <li className="flex items-center gap-2 dark:text-slate-300">
                <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                  VIDEO
                </span>
                &quot;show me all videos about Buddhist monasteries in
                Nepal&quot;
              </li>
              <li className="flex items-center gap-2 dark:text-slate-300">
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                  SEGMENT
                </span>
                &quot;find moments where they explain the meaning of butter lamp
                offerings&quot;
              </li>
              <li className="flex items-center gap-2 dark:text-slate-300">
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                  SEGMENT
                </span>
                &quot;show me clips about cultural preservation efforts in
                पशुपतिनाथ&quot;
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search Features */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/10 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 w-fit rounded-full bg-blue-500/10 p-3">
            <FiSearch className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="mb-2 font-medium text-slate-600 dark:text-slate-200">
            Smart Search
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Our AI understands context and meaning beyond simple keywords.
            Search by concepts, topics, or specific details in either language.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="rounded-xl bg-gradient-to-r from-purple-500/5 to-purple-500/10 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 w-fit rounded-full bg-purple-500/10 p-3">
            <FiVideo className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="mb-2 font-medium text-slate-600 dark:text-slate-200">
            Preview Snippets
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            See relevant transcript excerpts before watching. Results show
            matching segments with surrounding context to help you find exactly
            what you need.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="rounded-xl bg-gradient-to-r from-green-500/5 to-green-500/10 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 w-fit rounded-full bg-green-500/10 p-3">
            <FiBookOpen className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="mb-2 font-medium text-slate-600 dark:text-slate-200">
            Deep Content Access
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search through complete transcripts and metadata. Find specific
            moments or explore entire videos about your topics of interest.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
