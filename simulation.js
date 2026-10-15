/**
 * Population Genetics Simulation Engine (Wahlund Effect & Microevolution)
 * Mathematically equivalent to the R simulation engine in app.R
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PopGenSimulator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Helper: Uniform random number in [min, max)
   */
  function randUniform(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * Sample one index from probabilities array (cumulative sampling)
   */
  function sampleIndex(probabilities, sumWeights) {
    let r = Math.random() * sumWeights;
    for (let i = 0; i < probabilities.length; i++) {
      r -= probabilities[i];
      if (r <= 0) return i;
    }
    return probabilities.length - 1;
  }

  /**
   * Run the complete population genetics simulation
   *
   * @param {Object} input - Parameter object
   *   @param {number} input.pop_size - Population size N (2 - 1000)
   *   @param {number} input.init_p - Initial frequency of A1 allele p (0 - 1)
   *   @param {number} input.generations - Number of generations (2 - 1000)
   *   @param {number} input.replications - Number of replications (1 - 20)
   *   @param {number} input.num_subpops - Number of sub-populations (1 - 5)
   *   @param {boolean} input.non_random_mating - Enable distance-dependent mating
   *   @param {number} input.dist_decay - Distance decay coefficient for mating (0 - 50)
   *   @param {number} input.m_rate - Migration rate (0 - 0.5)
   *   @param {number} input.mu - Forward mutation rate A1 -> A2 (0 - 0.1)
   *   @param {number} input.nu - Reverse mutation rate A2 -> A1 (0 - 0.1)
   *   @param {number} input.w11 - Relative fitness of A1A1 (0 - 1)
   *   @param {number} input.w12 - Relative fitness of A1A2 (0 - 1)
   *   @param {number} input.w22 - Relative fitness of A2A2 (0 - 1)
   * @returns {Object} Simulation results
   */
  function runSimulation(input) {
    const N = Math.max(2, Math.floor(input.pop_size || 500));
    const p_init = Math.max(0, Math.min(1, Number(input.init_p ?? 0.5)));
    const generations = Math.max(1, Math.floor(input.generations || 50));
    const num_subpops = Math.max(1, Math.min(5, Math.floor(input.num_subpops || 1)));
    const reps = Math.max(1, Math.min(20, Math.floor(input.replications || 1)));
    const non_random_mating = Boolean(input.non_random_mating);
    const dist_decay = Math.max(0, Number(input.dist_decay || 10));
    const m_rate = Math.max(0, Math.min(0.5, Number(input.m_rate || 0.01)));
    const mu = Math.max(0, Math.min(0.1, Number(input.mu || 0)));
    const nu = Math.max(0, Math.min(0.1, Number(input.nu || 0)));
    const w11 = Math.max(0, Number(input.w11 ?? 1));
    const w12 = Math.max(0, Number(input.w12 ?? 1));
    const w22 = Math.max(0, Number(input.w22 ?? 1));

    const total_gens = generations + 1;
    const w = [w11, w12, w22];
    const max_w = Math.max(...w, 0.0001);

    // Subpopulation assignments (evenly distributed)
    const initial_subpop_assignments = new Int32Array(N);
    for (let i = 0; i < N; i++) {
      initial_subpop_assignments[i] = i % num_subpops; // 0-indexed: 0 to num_subpops - 1
    }

    // Subpopulation spatial centers matching R code:
    // centers_x <- seq(0.2, 0.8, length.out = num_subpops)
    // centers_y <- rep(c(0.2, 0.8), length.out = num_subpops)
    const centers_x = new Float64Array(num_subpops);
    const centers_y = new Float64Array(num_subpops);
    for (let s = 0; s < num_subpops; s++) {
      centers_x[s] = num_subpops === 1 ? 0.5 : 0.2 + (0.6 * s) / (num_subpops - 1);
      centers_y[s] = s % 2 === 0 ? 0.2 : 0.8;
    }

    // Baseline coordinates for individuals
    const base_x = new Float64Array(N);
    const base_y = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const s = initial_subpop_assignments[i];
      if (num_subpops > 1) {
        base_x[i] = Math.random() / num_subpops + centers_x[s];
        base_y[i] = Math.random() / num_subpops + centers_y[s];
      } else {
        base_x[i] = Math.random();
        base_y[i] = Math.random();
      }
    }

    // Storage for all replications
    // Each rep will have history array of length total_gens
    const all_reps_history = [];
    const rep_p_matrix = []; // [rep][gen] -> p

    // Detailed snapshots of Rep 0 for interactive playback and spatial plot
    const spatial_snapshots = [];

    // Storage for final population individuals of Rep 0
    let rep0_final_pop = null;

    // --- Simulation Loop per Replication ---
    for (let r = 0; r < reps; r++) {
      const rep_hist = [];
      const rep_p_row = new Float64Array(total_gens);

      // Current population state
      // Genotype: 1 = A1A1, 2 = A1A2, 3 = A2A2
      const current_gt = new Uint8Array(N);
      const current_subpop = new Int32Array(initial_subpop_assignments);
      const current_x = new Float64Array(base_x);
      const current_y = new Float64Array(base_y);

      // Initial Genotypes sampled with Hardy-Weinberg probabilities
      const q_init = 1 - p_init;
      const prob_A1A1 = p_init * p_init;
      const prob_A1A2 = 2 * p_init * q_init;
      // prob_A2A2 = q_init * q_init

      for (let i = 0; i < N; i++) {
        const rnd = Math.random();
        if (rnd < prob_A1A1) {
          current_gt[i] = 1;
        } else if (rnd < prob_A1A1 + prob_A1A2) {
          current_gt[i] = 2;
        } else {
          current_gt[i] = 3;
        }
      }

      // If r === 0, record snapshot at gen 0
      if (r === 0) {
        spatial_snapshots.push({
          gen: 0,
          gt: new Uint8Array(current_gt),
          subpop: new Int32Array(current_subpop),
          x: new Float64Array(current_x),
          y: new Float64Array(current_y),
        });
      }

      // Loop generations
      for (let t = 0; t < total_gens; t++) {
        const gen_idx = t;

        // --- Statistics Calculation (Exact R equivalent) ---
        let count_A1_total = 0;
        let count_A1A1 = 0;
        let count_A1A2 = 0;
        let count_A2A2 = 0;

        for (let i = 0; i < N; i++) {
          const g = current_gt[i];
          if (g === 1) {
            count_A1_total += 2;
            count_A1A1++;
          } else if (g === 2) {
            count_A1_total += 1;
            count_A1A2++;
          } else {
            count_A2A2++;
          }
        }

        const p_global = count_A1_total / (2 * N);
        const f_A1A1 = count_A1A1 / N;
        const f_A1A2 = count_A1A2 / N;
        const f_A2A2 = count_A2A2 / N;

        // F-statistics calculation
        let fst = 0;
        let fis = 0;
        let fit = 0;
        let HT = 0;
        let HS = 0;
        let HI = 0;

        if (num_subpops > 1) {
          const n_sub = new Float64Array(num_subpops);
          const sum_A1_sub = new Float64Array(num_subpops);
          const n_het_sub = new Float64Array(num_subpops);

          for (let i = 0; i < N; i++) {
            const s = current_subpop[i];
            if (s >= 0 && s < num_subpops) {
              n_sub[s]++;
              if (current_gt[i] === 1) sum_A1_sub[s] += 2;
              else if (current_gt[i] === 2) {
                sum_A1_sub[s] += 1;
                n_het_sub[s]++;
              }
            }
          }

          let valid_count = 0;
          let sum_p_sub = 0;
          const p_sub = new Float64Array(num_subpops);
          const obs_het_sub = new Float64Array(num_subpops);
          const exp_het_sub = new Float64Array(num_subpops);

          for (let s = 0; s < num_subpops; s++) {
            if (n_sub[s] > 0) {
              valid_count++;
              p_sub[s] = sum_A1_sub[s] / (2 * n_sub[s]);
              obs_het_sub[s] = n_het_sub[s] / n_sub[s];
              exp_het_sub[s] = 2 * p_sub[s] * (1 - p_sub[s]);
              sum_p_sub += p_sub[s];
            }
          }

          if (valid_count > 0) {
            const mean_p = sum_p_sub / valid_count;
            HT = 2 * mean_p * (1 - mean_p);

            let sum_exp = 0;
            let sum_obs = 0;
            for (let s = 0; s < num_subpops; s++) {
              if (n_sub[s] > 0) {
                sum_exp += exp_het_sub[s];
                sum_obs += obs_het_sub[s];
              }
            }
            HS = sum_exp / valid_count;
            HI = sum_obs / valid_count;

            fst = HT > 0 ? (HT - HS) / HT : 0;
            fis = HS > 0 ? (HS - HI) / HS : 0;
            fit = HT > 0 ? (HT - HI) / HT : 0;
          }
        } else {
          // Single population: no substructure
          HT = 2 * p_global * (1 - p_global);
          HS = HT;
          HI = f_A1A2;
          fst = 0;
          fis = HS > 0 ? (HS - HI) / HS : 0;
          fit = HT > 0 ? (HT - HI) / HT : 0;
        }

        const statObj = {
          Generation: gen_idx,
          Rep: r + 1,
          p: p_global,
          A1A1: f_A1A1,
          A1A2: f_A1A2,
          A2A2: f_A2A2,
          Fst: fst,
          Fis: fis,
          Fit: fit,
          HT: HT,
          HS: HS,
          HI: HI,
        };

        rep_hist.push(statObj);
        rep_p_row[t] = p_global;

        // If last generation, finish simulation loop for this replication
        if (gen_idx === generations) {
          if (r === 0) {
            // Save final population coordinates and state
            const final_pop = [];
            for (let i = 0; i < N; i++) {
              final_pop.push({
                id: i + 1,
                x: current_x[i],
                y: current_y[i],
                subpop: current_subpop[i] + 1,
                gt: current_gt[i] === 1 ? 'A1A1' : current_gt[i] === 2 ? 'A1A2' : 'A2A2',
                gt_num: current_gt[i],
              });
            }
            rep0_final_pop = final_pop;
          }
          break;
        }

        // --- Evolution Step ---

        // 1. Selection
        const survivors_idx = [];
        for (let i = 0; i < N; i++) {
          const fitness = w[current_gt[i] - 1];
          const survive_prob = fitness / max_w;
          if (Math.random() < survive_prob) {
            survivors_idx.push(i);
          }
        }

        // Ensure at least 2 survivors
        if (survivors_idx.length < 2) {
          survivors_idx.length = 0;
          const idx1 = Math.floor(Math.random() * N);
          let idx2 = Math.floor(Math.random() * N);
          if (idx2 === idx1) idx2 = (idx1 + 1) % N;
          survivors_idx.push(idx1, idx2);
        }

        const num_survivors = survivors_idx.length;

        // 2. Reproduction
        const next_gt = new Uint8Array(N);
        const next_subpop = new Int32Array(current_subpop);
        const next_x = new Float64Array(current_x);
        const next_y = new Float64Array(current_y);

        for (let i = 0; i < N; i++) {
          // Parent 1 chosen uniformly from survivors
          const p1 = survivors_idx[Math.floor(Math.random() * num_survivors)];
          let p2;

          if (non_random_mating && dist_decay > 0) {
            // Distance-dependent mating probability proportional to exp(-decay * dist)
            const p1_x = current_x[p1];
            const p1_y = current_y[p1];
            const weights = new Float64Array(num_survivors);
            let total_weight = 0;

            for (let k = 0; k < num_survivors; k++) {
              const s_idx = survivors_idx[k];
              const dx = p1_x - current_x[s_idx];
              const dy = p1_y - current_y[s_idx];
              const dist = Math.sqrt(dx * dx + dy * dy);
              const wt = Math.exp(-dist_decay * dist);
              weights[k] = wt;
              total_weight += wt;
            }

            const chosen_k = sampleIndex(weights, total_weight);
            p2 = survivors_idx[chosen_k];
          } else {
            p2 = survivors_idx[Math.floor(Math.random() * num_survivors)];
          }

          // Mendelian Inheritance
          const gt1 = current_gt[p1];
          const gt2 = current_gt[p2];

          // Allele 1 from Parent 1 (1 = A1, 2 = A2)
          let allele1;
          if (gt1 === 1) allele1 = 1;
          else if (gt1 === 3) allele1 = 2;
          else allele1 = Math.random() < 0.5 ? 1 : 2;

          // Allele 2 from Parent 2
          let allele2;
          if (gt2 === 1) allele2 = 1;
          else if (gt2 === 3) allele2 = 2;
          else allele2 = Math.random() < 0.5 ? 1 : 2;

          // 3. Mutation
          if (allele1 === 1 && Math.random() < mu) allele1 = 2;
          else if (allele1 === 2 && Math.random() < nu) allele1 = 1;

          if (allele2 === 1 && Math.random() < mu) allele2 = 2;
          else if (allele2 === 2 && Math.random() < nu) allele2 = 1;

          // Combine to form offspring genotype (1: A1A1, 2: A1A2, 3: A2A2)
          const sum_alleles = allele1 + allele2;
          next_gt[i] = sum_alleles === 2 ? 1 : sum_alleles === 3 ? 2 : 3;

          // Offspring inherits spatial neighborhood from parent 1 with slight jitter
          if (num_subpops > 1) {
            const s = current_subpop[p1];
            next_subpop[i] = s;
            // Retain within subpopulation cluster
            next_x[i] = Math.random() / num_subpops + centers_x[s];
            next_y[i] = Math.random() / num_subpops + centers_y[s];
          } else {
            next_x[i] = Math.random();
            next_y[i] = Math.random();
          }
        }

        // 4. Migration between subpopulations
        if (num_subpops > 1 && m_rate > 0) {
          const n_migrants = Math.floor(N * m_rate);
          if (n_migrants > 0) {
            for (let m = 0; m < n_migrants; m++) {
              const migrant_idx = Math.floor(Math.random() * N);
              const target_subpop = Math.floor(Math.random() * num_subpops);
              next_subpop[migrant_idx] = target_subpop;
              // Relocate migrant to new subpop territory
              next_x[migrant_idx] = Math.random() / num_subpops + centers_x[target_subpop];
              next_y[migrant_idx] = Math.random() / num_subpops + centers_y[target_subpop];
            }
          }
        }

        // Copy state over to current for next generation
        current_gt.set(next_gt);
        current_subpop.set(next_subpop);
        current_x.set(next_x);
        current_y.set(next_y);

        // Store snapshot for Rep 0 (sample at reasonable intervals if generations is large)
        if (r === 0) {
          const record_step = generations > 200 ? Math.ceil(generations / 100) : 1;
          if ((t + 1) % record_step === 0 || t + 1 === generations) {
            spatial_snapshots.push({
              gen: t + 1,
              gt: new Uint8Array(current_gt),
              subpop: new Int32Array(current_subpop),
              x: new Float64Array(current_x),
              y: new Float64Array(current_y),
            });
          }
        }
      }

      all_reps_history.push(rep_hist);
      rep_p_matrix.push(rep_p_row);
    }

    // --- Aggregate Multi-Replication Summary ---
    const summary = [];
    for (let t = 0; t < total_gens; t++) {
      let sum_p = 0;
      let sum_A1A1 = 0;
      let sum_A1A2 = 0;
      let sum_A2A2 = 0;
      let sum_Fst = 0;
      let sum_Fis = 0;
      let sum_Fit = 0;
      let sum_HT = 0;
      let sum_HS = 0;
      let sum_HI = 0;

      for (let r = 0; r < reps; r++) {
        const row = all_reps_history[r][t];
        sum_p += row.p;
        sum_A1A1 += row.A1A1;
        sum_A1A2 += row.A1A2;
        sum_A2A2 += row.A2A2;
        sum_Fst += row.Fst;
        sum_Fis += row.Fis;
        sum_Fit += row.Fit;
        sum_HT += row.HT;
        sum_HS += row.HS;
        sum_HI += row.HI;
      }

      const mean_p = sum_p / reps;
      const mean_A1A1 = sum_A1A1 / reps;
      const mean_A1A2 = sum_A1A2 / reps;
      const mean_A2A2 = sum_A2A2 / reps;
      const mean_Fst = sum_Fst / reps;
      const mean_Fis = sum_Fis / reps;
      const mean_Fit = sum_Fit / reps;
      const mean_HT = sum_HT / reps;
      const mean_HS = sum_HS / reps;
      const mean_HI = sum_HI / reps;

      // Variance across replications for p
      let var_p = 0;
      if (reps > 1) {
        for (let r = 0; r < reps; r++) {
          const diff = all_reps_history[r][t].p - mean_p;
          var_p += diff * diff;
        }
        var_p /= reps - 1;
      }

      // Theoretical Hardy-Weinberg expected frequencies based on current mean_p:
      const hw_A1A1 = mean_p * mean_p;
      const hw_A1A2 = 2 * mean_p * (1 - mean_p);
      const hw_A2A2 = (1 - mean_p) * (1 - mean_p);

      summary.push({
        Generation: t,
        p_mean: mean_p,
        p_sd: Math.sqrt(var_p),
        A1A1_mean: mean_A1A1,
        A1A2_mean: mean_A1A2,
        A2A2_mean: mean_A2A2,
        hw_A1A1: hw_A1A1,
        hw_A1A2: hw_A1A2,
        hw_A2A2: hw_A2A2,
        Fst_mean: mean_Fst,
        Fis_mean: mean_Fis,
        Fit_mean: mean_Fit,
        HT_mean: mean_HT,
        HS_mean: mean_HS,
        HI_mean: mean_HI,
        DeltaH_mean: Math.max(0, mean_HT - mean_HS), // Wahlund heterozygosity deficit
      });
    }

    const finalSummary = summary[summary.length - 1];

    return {
      params: input,
      reps: reps,
      generations: generations,
      num_subpops: num_subpops,
      all_reps_history: all_reps_history,
      rep_p_matrix: rep_p_matrix,
      summary: summary,
      final_pop: rep0_final_pop,
      spatial_snapshots: spatial_snapshots,
      finalStats: {
        p: finalSummary.p_mean,
        delta_p: finalSummary.p_mean - p_init,
        Fst: finalSummary.Fst_mean,
        Fis: finalSummary.Fis_mean,
        Fit: finalSummary.Fit_mean,
        HT: finalSummary.HT_mean,
        HS: finalSummary.HS_mean,
        HI: finalSummary.HI_mean,
        DeltaH: finalSummary.DeltaH_mean,
        fixed_A1: finalSummary.p_mean >= 0.999,
        fixed_A2: finalSummary.p_mean <= 0.001,
      },
    };
  }

  return {
    runSimulation: runSimulation,
  };
});
